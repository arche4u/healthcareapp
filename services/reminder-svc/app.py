"""
OneHealth Reminder Service
Schedules and delivers medication reminders via push/SMS/IVR.
Uses Celery + Redis for distributed task queue.
"""
from typing import Optional
import os
import logging
import json
from datetime import datetime, timezone, timedelta

from flask import Flask, request, jsonify
from celery import Celery
from shared.sdk.auth import decode_token
from shared.sdk.database import get_db_session
from shared.sdk.models import Patient, User, MedicationRequest, ReminderQueue

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Celery configuration
celery = Celery(
    "reminders",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


def create_app():
    app = Flask(__name__)
    app.config["CELERY"] = celery

    @app.route("/reminders/health")
    def health():
        return jsonify({"status": "ok", "service": "reminder-svc"})

    def _get_current_user():
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        return decode_token(token)

    @app.route("/reminders/schedule", methods=["POST"])
    def schedule_reminder():
        """Schedule a medication reminder for a patient."""
        user = _get_current_user()
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        medication_request_id = data.get("medication_request_id")
        scheduled_at = data.get("scheduled_at")  # ISO datetime string

        if not patient_id or not scheduled_at:
            return jsonify({"error": "patient_id and scheduled_at required"}), 400

        # Parse scheduled time
        try:
            schedule_time = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"error": "Invalid scheduled_at format"}), 400

        db = next(get_db_session())
        try:
            # Get patient's contact preferences
            patient = db.get(Patient, patient_id)
            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            # Check consent before sending reminders (stub)
            # TODO: Check Consent model for reminder-permission

            # Determine delivery channel
            # 1. Try push notification (PWA/WebPush)
            # 2. Fallback to SMS
            # 3. Fallback to IVR
            channel = data.get("channel", _determine_best_channel(patient))
            destination = data.get("channel_destination", _get_channel_destination(patient, channel))

            # Create reminder queue entry
            idempotency_key = f"reminder-{patient_id}-{medication_request_id}-{scheduled_at}"
            existing = db.query(ReminderQueue).filter(
                ReminderQueue.idempotency_key == idempotency_key
            ).first()
            if existing:
                return jsonify({"id": str(existing.id), "status": existing.status}), 200

            reminder = ReminderQueue(
                patient_id=patient_id,
                medication_request_id=medication_request_id,
                scheduled_at=schedule_time,
                channel=channel,
                channel_destination=destination,
                message_template=data.get("message_template", "Time to take your medication."),
                message_data=data.get("message_data", {}),
                idempotency_key=idempotency_key,
            )
            db.add(reminder)
            db.commit()

            # Schedule Celery task
            celery.send_task(
                "reminders.deliver",
                args=[str(reminder.id)],
                eta=schedule_time,
                task_id=f"reminder-delivery-{reminder.id}",
            )

            logger.info(f"Scheduled reminder {reminder.id} for patient {patient_id} at {schedule_time}")

            return jsonify({
                "id": str(reminder.id),
                "status": "scheduled",
                "scheduled_at": schedule_time.isoformat(),
                "channel": channel,
            }), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Schedule reminder failed: {e}")
            return jsonify({"error": "Failed to schedule reminder"}), 500
        finally:
            db.close()

    @app.route("/reminders/from-prescription", methods=["POST"])
    def schedule_from_prescription():
        """Generate reminder schedule from a MedicationRequest's dosage instruction."""
        user = _get_current_user()
        data = request.get_json() or {}
        medication_request_id = data.get("medication_request_id")

        if not medication_request_id:
            return jsonify({"error": "medication_request_id required"}), 400

        db = next(get_db_session())
        try:
            med_req = db.get(MedicationRequest, medication_request_id)
            if not med_req:
                return jsonify({"error": "MedicationRequest not found"}), 404

            doses_scheduled = _generate_dose_schedule(med_req)

            scheduled = []
            for dose_time, reminder_template in doses_scheduled:
                # Schedule reminder
                schedule_data = {
                    "patient_id": str(med_req.patient_id),
                    "medication_request_id": str(med_req.id),
                    "scheduled_at": dose_time.isoformat(),
                    "message_template": reminder_template.get("template", "Time to take your medication."),
                    "message_data": reminder_template.get("data", {}),
                }

                # We can't call self - directly create in DB
                reminder = ReminderQueue(
                    patient_id=med_req.patient_id,
                    medication_request_id=med_req.id,
                    scheduled_at=dose_time,
                    channel=_determine_best_channel(med_req.patient),
                    channel_destination=_get_channel_destination(med_req.patient, "push"),
                    message_template=reminder_template.get("template", "Time to take your medication."),
                    message_data=reminder_template.get("data", {}),
                    idempotency_key=f"rx-{med_req.id}-{dose_time.isoformat()}",
                )
                db.add(reminder)

                # Schedule Celery task
                celery.send_task(
                    "reminders.deliver",
                    args=[str(reminder.id)],
                    eta=dose_time,
                )

                scheduled.append({
                    "reminder_id": str(reminder.id),
                    "scheduled_at": dose_time.isoformat(),
                })

            db.commit()

            return jsonify({
                "medication_request_id": str(med_req.id),
                "reminders_scheduled": len(scheduled),
                "reminders": scheduled,
            })

        except Exception as e:
            db.rollback()
            logger.error(f"Schedule from prescription failed: {e}")
            return jsonify({"error": "Failed to schedule reminders"}), 500
        finally:
            db.close()

    @app.route("/reminders/<reminder_id>/deliver", methods=["POST"])
    def deliver_reminder(reminder_id):
        """Deliver a single reminder (manual trigger)."""
        db = next(get_db_session())
        try:
            reminder = db.get(ReminderQueue, reminder_id)
            if not reminder:
                return jsonify({"error": "Reminder not found"}), 404

            # Use Celery task to deliver
            result = deliver_reminder_task.delay(reminder_id)

            return jsonify({
                "reminder_id": str(reminder.id),
                "task_id": result.id,
                "status": "processing",
            })

        finally:
            db.close()

    @app.route("/reminders/patient/<patient_id>", methods=["GET"])
    def get_patient_reminders(patient_id):
        """Get all upcoming reminders for a patient."""
        user = _get_current_user()

        # Only patient themselves or authorized doctor
        if user:
            if user.patient_id and str(user.patient_id) != str(patient_id):
                return jsonify({"error": "Access denied"}), 403

        db = next(get_db_session())
        try:
            now = datetime.now(timezone.utc)
            reminders = db.query(ReminderQueue).filter(
                ReminderQueue.patient_id == patient_id,
                ReminderQueue.scheduled_at >= now,
                ReminderQueue.status.in_(["pending", "scheduled"])
            ).order_by(ReminderQueue.scheduled_at).limit(30).all()

            return jsonify({
                "patient_id": str(patient_id),
                "reminders": [{
                    "id": str(r.id),
                    "scheduled_at": r.scheduled_at.isoformat(),
                    "channel": r.channel,
                    "message_template": r.message_template,
                    "status": r.status,
                } for r in reminders]
            })

        finally:
            db.close()

    @app.route("/reminders/<reminder_id>/acknowledge", methods=["POST"])
    def acknowledge_reminder(reminder_id):
        """Patient acknowledges they've taken the dose."""
        db = next(get_db_session())
        try:
            reminder = db.get(ReminderQueue, reminder_id)
            if not reminder:
                return jsonify({"error": "Reminder not found"}), 404

            data = request.get_json() or {}
            status = data.get("status", "delivered")

            reminder.status = status
            reminder.delivered_at = datetime.now(timezone.utc)
            db.commit()

            return jsonify({
                "id": str(reminder.id),
                "status": reminder.status,
                "delivered_at": reminder.delivered_at.isoformat(),
            })

        except Exception as e:
            db.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()

    return app


# ─── Helper functions ──────────────────────────────────────────────────────────

def _determine_best_channel(patient: Patient) -> str:
    """Determine the best delivery channel for a patient."""
    # Check telecom for smartphone
    has_sms = any(
        t.get("system") == "phone" and t.get("use") == "mobile"
        for t in (patient.telecom or [])
    )

    # Default: push (PWA) → SMS fallback
    return "push" if has_sms else "sms"


def _get_channel_destination(patient: Patient, channel: str) -> Optional[str]:
    """Get the delivery destination for a channel."""
    if channel == "push":
        # Would look up patient's WebPush subscription or FCM token
        return None  # stub
    elif channel == "sms":
        for t in (patient.telecom or []):
            if t.get("system") == "phone":
                return t.get("value")
    elif channel == "ivr":
        # Would look up IVR provider config
        return None
    return None


def _generate_dose_schedule(med_req: MedicationRequest) -> list:
    """
    Parse dosageInstruction and generate reminder times.
    Returns list of (datetime, template_dict).
    """
    doses = []
    dosage_instructions = med_req.dosage_instruction or []

    for instruction in dosage_instructions:
        timing = instruction.get("timing", {})
        repeat = timing.get("repeat", {})

        frequency = repeat.get("frequency", 1)
        period = repeat.get("period", 1)
        period_unit = repeat.get("periodUnit", "d")

        # Calculate total duration
        dispense = med_req.dispense_request or {}
        validity = dispense.get("validityPeriod", {})
        duration = validity.get("duration", 7)
        duration_unit = validity.get("durationUnit", "d")

        # Convert to days
        if period_unit == "d":
            dose_interval = period / frequency
        elif period_unit == "wk":
            dose_interval = (period * 7) / frequency
        elif period_unit == "mo":
            dose_interval = (period * 30) / frequency
        else:
            dose_interval = 1.0

        total_days = duration if duration_unit == "d" else duration * (30 if duration_unit == "mo" else 7 if duration_unit == "wk" else 1)

        # Generate doses
        start_time = med_req.authored_on or datetime.now(timezone.utc)
        for day in range(int(total_days)):
            for dose_num in range(frequency):
                dose_time = start_time + timedelta(days=day, hours=int(dose_interval * dose_num))

                # Determine a reasonable time (default 8am, 2pm, 8pm for 3x daily)
                if frequency == 3:
                    hour = [8, 14, 20][dose_num % 3]
                elif frequency == 2:
                    hour = [9, 21][dose_num % 2]
                elif frequency == 1:
                    hour = 9
                else:
                    hour = 9

                dose_time = dose_time.replace(hour=hour, minute=0, second=0, microsecond=0)

                med_name = ""
                if med_req.medication_codeable_concept:
                    med_name = med_req.medication_codeable_concept.get("text", "your medication")

                template = {
                    "template": f"Time to take {med_name}. {instruction.get('text', 'Take as prescribed')}.",
                    "data": {
                        "medication_name": med_name,
                        "dosage": instruction.get("text", ""),
                        "patient_name": "Patient",  # would be filled from patient
                    },
                }

                doses.append((dose_time, template))

    return doses


# ─── Celery tasks ──────────────────────────────────────────────────────────────

@celery.task(name="reminders.deliver")
def deliver_reminder_task(reminder_id: str):
    """Celery task to deliver a reminder."""
    logger.info(f"Delivering reminder {reminder_id}")

    db = next(get_db_session())
    try:
        reminder = db.get(ReminderQueue, reminder_id)
        if not reminder:
            logger.error(f"Reminder {reminder_id} not found")
            return {"error": "not found"}

        # Attempt delivery based on channel
        success = False
        error_msg = None

        if reminder.channel == "push":
            success, error_msg = _deliver_push(reminder)
        elif reminder.channel == "sms":
            success, error_msg = _deliver_sms(reminder)
        elif reminder.channel == "ivr":
            success, error_msg = _deliver_ivr(reminder)

        reminder.attempts += 1
        reminder.last_attempt_at = datetime.now(timezone.utc)

        if success:
            reminder.status = "delivered"
            reminder.delivered_at = datetime.now(timezone.utc)
        else:
            if reminder.attempts >= 3:
                reminder.status = "failed"
            else:
                reminder.status = "pending"
            reminder.error_message = error_msg

        db.commit()

        return {
            "reminder_id": str(reminder.id),
            "status": reminder.status,
            "attempts": reminder.attempts,
            "success": success,
        }

    except Exception as e:
        logger.error(f"Reminder delivery failed: {e}")
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def _deliver_push(reminder: ReminderQueue) -> tuple[bool, str]:
    """Send Web Push notification (stub)."""
    # STUB: Would use webpush library with patient's subscription endpoint
    logger.warning(f"Push notification stub for reminder {reminder.id}")
    return True, None


def _deliver_sms(reminder: ReminderQueue) -> tuple[bool, str]:
    """Send SMS via gateway (stub)."""
    sms_provider = os.getenv("SMS_PROVIDER", "stub")
    if sms_provider == "stub":
        logger.warning(f"SMS stub for reminder {reminder.id} to {reminder.channel_destination}")
        return True, None

    # Real implementation would call SMS gateway API
    import httpx
    try:
        resp = httpx.post(
            os.getenv("SMS_API_URL", "https://api.twilio.com/"),
            json={
                "to": reminder.channel_destination,
                "body": reminder.message_template,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            return True, None
        return False, f"SMS provider returned {resp.status_code}"
    except Exception as e:
        return False, str(e)


def _deliver_ivr(reminder: ReminderQueue) -> tuple[bool, str]:
    """Send IVR voice call (stub)."""
    ivr_provider = os.getenv("IVR_PROVIDER", "stub")
    if ivr_provider == "stub":
        logger.warning(f"IVR stub for reminder {reminder.id}")
        return True, None

    # Real implementation would call IVR provider
    return True, None


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "5003"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)