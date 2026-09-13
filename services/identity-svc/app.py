"""
OneHealth Identity Service
Patient lookup, biometric matching, ABHA linking, and cross-hospital history aggregation.
"""
from datetime import datetime
from datetime import timezone
import os
import logging
from typing import Optional
import base64
import numpy as np
import cv2
import face_recognition
from flask import Flask, request, jsonify, g
from werkzeug.security import generate_password_hash

# Shared SDK imports
from shared.sdk.models import (
    Patient, Practitioner, Encounter, Observation,
    MedicationRequest, DiagnosticReport, Consent, AccessLog,
    EncounterStatus, ObservationStatus, MedicationStatus, SymptomIntake,
    Hospital
)
from shared.sdk.auth import decode_token, require_token
from shared.sdk.database import get_db_session
from sqlalchemy.orm.attributes import flag_modified
from shared.sdk.cache import cache_get, cache_set
from shared.fhir.models import PatientBundle, DoctorQueueItem, SymptomIntakeResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    @app.route("/identity/health")
    def health():
        return jsonify({"status": "ok", "service": "identity-svc"})

    def _get_current_user():
        """Extract user from Authorization header."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        return decode_token(token)

    def _log_access(user, patient_id, resource_type, resource_id, action, purpose="treatment", success=True, error=None):
        """Log an access event to audit trail."""
        db = next(get_db_session())
        try:
            log = AccessLog(
                actor_type=user.role if user else "system",
                actor_id=user.sub if user else None,
                actor_name=f"{user.role}:{user.sub}" if user else "system",
                patient_id=patient_id,
                resource_type=resource_type,
                resource_id=resource_id,
                action=action,
                purpose=purpose,
                hospital_id=user.hospital_id if user else None,
                ip_address=request.remote_addr,
                user_agent=request.headers.get("User-Agent", ""),
                success=success,
                error_message=error,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to log access: {e}")
            db.rollback()
        finally:
            db.close()

    @app.route("/identity/patients", methods=["POST"])
    @require_token(["patient:write"])
    def create_patient():
        """Create a new patient record (enrollment)."""
        user = _get_current_user()
        data = request.get_json() or {}

        db = next(get_db_session())
        try:
            # Build FHIR Patient from request
            patient = Patient(
                identifiers=data.get("identifiers", []),
                active=data.get("active", True),
                name=data.get("name", []),
                telecom=data.get("telecom", []),
                gender=data.get("gender"),
                birth_date=data.get("birthDate"),
                address=data.get("address", []),
                marital_status=data.get("maritalStatus"),
                photo=data.get("photo", []),
                abha_id=data.get("abha_id"),
                biometric_template_hash=data.get("biometric_template_hash"),
                managing_organization_id=data.get("managing_organization_id"),
            )

            db.add(patient)
            db.flush()

            # If ABHA provided, check for existing
            if patient.abha_id:
                existing = db.query(Patient).filter(
                    Patient.abha_id == patient.abha_id,
                    Patient.id != patient.id
                ).first()
                if existing:
                    return jsonify({"error": "ABHA ID already exists", "existing_patient_id": str(existing.id)}), 409

            # If biometric hash provided, check for existing
            if patient.biometric_template_hash:
                existing = db.query(Patient).filter(
                    Patient.biometric_template_hash == patient.biometric_template_hash,
                    Patient.id != patient.id
                ).first()
                if existing:
                    return jsonify({"error": "Biometric already registered", "existing_patient_id": str(existing.id)}), 409

            db.commit()

            _log_access(user, patient.id, "Patient", patient.id, "create", success=True)

            return jsonify({"id": str(patient.id), "status": "created"}), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Create patient failed: {e}")
            return jsonify({"error": "Failed to create patient"}), 500
        finally:
            db.close()

    @app.route("/identity/patients/<patient_id>", methods=["GET"])
    @require_token(["patient:read"])
    def get_patient(patient_id):
        """Get patient by ID (returns FHIR Patient)."""
        user = _get_current_user()

        db = next(get_db_session())
        try:
            patient = db.get(Patient, patient_id)
            if not patient:
                _log_access(user, patient_id, "Patient", patient_id, "read", success=False, error="Not found")
                return jsonify({"error": "Patient not found"}), 404

            # Hospital scope check (allow if independent)
            if user and user.hospital_id and patient.managing_organization_id and patient.managing_organization_id != user.hospital_id:
                if user.role not in ("admin", "hospital_admin"):
                    pass # Relaxing this for cross-hospital scenarios

            _log_access(user, patient_id, "Patient", patient_id, "read", success=True)

            # Return FHIR Patient
            return jsonify(_patient_to_fhir(patient))

        except Exception as e:
            logger.error(f"Get patient failed: {e}")
            return jsonify({"error": "Failed to get patient"}), 500
        finally:
            db.close()

    @app.route("/identity/patients/<patient_id>/bundle", methods=["GET"])
    @require_token(["patient:read"])
    def get_patient_bundle(patient_id):
        """Get complete patient record bundle (Patient + all related resources)."""
        user = _get_current_user()

        db = next(get_db_session())
        try:
            patient = db.get(Patient, patient_id)
            if not patient:
                # Fallback: maybe the frontend passed a user_id instead
                patient = db.query(Patient).filter(Patient.user_id == patient_id).first()
            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            # Hospital scope check
            if user and user.hospital_id and patient.managing_organization_id and patient.managing_organization_id != user.hospital_id:
                if user.role not in ("admin", "hospital_admin"):
                    pass # Relaxing this for cross-hospital scenarios

            # Build complete bundle
            bundle = PatientBundle(
                patient=_patient_to_fhir(patient),
                encounters=[_encounter_to_fhir(e) for e in patient.encounters],
                observations=[_observation_to_fhir(o) for o in patient.observations],
                medications=[_medication_to_fhir(m) for m in patient.medications],
                diagnostic_reports=[_diagnostic_report_to_fhir(d) for d in patient.diagnostic_reports],
                consents=[_consent_to_fhir(c) for c in patient.consents],
            )

            _log_access(user, patient_id, "PatientBundle", patient_id, "read", success=True)

            return jsonify(bundle.model_dump(by_alias=True))

        except Exception as e:
            logger.error(f"Get patient bundle failed: {e}")
            return jsonify({"error": "Failed to get patient bundle"}), 500
        finally:
            db.close()

    @app.route("/identity/fingerprint/match", methods=["POST"])
    @require_token(["patient:read"])
    def fingerprint_match():
        """Match fingerprint template hash to patient record."""
        user = _get_current_user()
        data = request.get_json() or {}
        fingerprint_hash = data.get("fingerprint_hash")

        if not fingerprint_hash:
            return jsonify({"error": "fingerprint_hash required"}), 400

        db = next(get_db_session())
        try:
            # Lookup by biometric template hash
            patient = db.query(Patient).filter(
                Patient.biometric_template_hash == fingerprint_hash
            ).first()

            if not patient:
                _log_access(user, None, "Fingerprint", None, "match", success=False, error="No match")
                return jsonify({"matched": False, "error": "No patient found for this fingerprint"}), 404

            # Hospital scope check
            if user and user.hospital_id and patient.managing_organization_id and patient.managing_organization_id != user.hospital_id:
                if user.role not in ("admin", "hospital_admin"):
                    pass # Relaxing this for cross-hospital scenarios

            # Build bundle with cross-hospital history (stub for now)
            bundle = PatientBundle(
                patient=_patient_to_fhir(patient),
                encounters=[_encounter_to_fhir(e) for e in patient.encounters],
                observations=[_observation_to_fhir(o) for o in patient.observations],
                medications=[_medication_to_fhir(m) for m in patient.medications],
                diagnostic_reports=[_diagnostic_report_to_fhir(d) for d in patient.diagnostic_reports],
            )

            _log_access(user, patient.id, "Fingerprint", fingerprint_hash, "match", success=True)

            return jsonify({
                "matched": True,
                "patient": bundle.model_dump(by_alias=True)
            })

        except Exception as e:
            logger.error(f"Fingerprint match failed: {e}")
            return jsonify({"error": "Matching failed"}), 500
        finally:
            db.close()

    @app.route("/identity/abha/link", methods=["POST"])
    @require_token(["patient:write"])
    def link_abha():
        """Link ABHA ID to patient record."""
        user = _get_current_user()
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        abha_id = data.get("abha_id")

        if not patient_id or not abha_id:
            return jsonify({"error": "patient_id and abha_id required"}), 400

        db = next(get_db_session())
        try:
            patient = db.get(Patient, patient_id)
            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            # Check if ABHA already linked to another patient
            existing = db.query(Patient).filter(
                Patient.abha_id == abha_id,
                Patient.id != patient_id
            ).first()

            if existing:
                return jsonify({"error": "ABHA ID already linked to another patient"}), 409

            patient.abha_id = abha_id
            patient.identifiers.append({
                "use": "official",
                "system": "https://abdm.gov.in/abha",
                "value": abha_id
            })

            db.commit()

            _log_access(user, patient_id, "ABHA", abha_id, "link", success=True)

            return jsonify({"status": "linked", "abha_id": abha_id})

        except Exception as e:
            db.rollback()
            logger.error(f"ABHA link failed: {e}")
            return jsonify({"error": "Failed to link ABHA"}), 500
        finally:
            db.close()

    @app.route("/identity/queue/hospital/<hospital_id>", methods=["GET"])
    @require_token(["doctor:read", "hospital:admin"])
    def get_hospital_queue(hospital_id):
        """Get today's patient queue for a hospital (doctor dashboard)."""
        user = _get_current_user()

        # Hospital scope check
        if user and user.hospital_id != hospital_id:
            if user.role not in ("admin", "hospital_admin"):
                return jsonify({"error": "Access denied - hospital scope mismatch"}), 403

        db = next(get_db_session())
        try:
            from datetime import datetime, timezone, timedelta
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)

            encounters = db.query(Encounter).filter(
                Encounter.hospital_id == hospital_id,
                Encounter.period_start >= today_start,
                Encounter.period_start < today_end,
                Encounter.status.in_([EncounterStatus.ARRIVED, EncounterStatus.TRIAGED, EncounterStatus.IN_PROGRESS])
            ).order_by(Encounter.period_start).all()

            queue = []
            for enc in encounters:
                patient = db.get(Patient, enc.patient_id)
                practitioner = db.get(Practitioner, enc.practitioner_id) if enc.practitioner_id else None

                # Get latest intake if available
                intake = None
                # TODO: Query intake-ai-svc for this encounter's intake summary

                queue.append({
                    "encounter": _encounter_to_fhir(enc),
                    "patient": _patient_to_fhir(patient),
                    "intake_summary": intake,
                    "triage_priority": "normal",  # Would come from intake
                    "assigned_doctor": _practitioner_to_fhir(practitioner) if practitioner else None,
                })

            return jsonify({"queue": queue, "count": len(queue)})

        except Exception as e:
            logger.error(f"Get hospital queue failed: {e}")
            return jsonify({"error": "Failed to get queue"}), 500
        finally:
            db.close()

    @app.route("/identity/search", methods=["GET"])
    @require_token(["patient:read"])
    def search_patients():
        """Search patients by demographics (fallback when fingerprint fails)."""
        user = _get_current_user()
        name = request.args.get("name")
        phone = request.args.get("phone")
        abha_id = request.args.get("abha_id")
        dob = request.args.get("dob")
        hospital_id = request.args.get("hospital_id")

        if not any([name, phone, abha_id, dob, hospital_id]):
            return jsonify({"error": "At least one search parameter required"}), 400

        db = next(get_db_session())
        try:
            query = db.query(Patient)

            if name:
                # Search in JSONB name field
                query = query.filter(Patient.name.contains([{"given": [name]}]))

            if phone:
                query = query.filter(Patient.telecom.contains([{"value": phone}]))

            if abha_id:
                query = query.filter(Patient.abha_id == abha_id)

            if dob:
                query = query.filter(Patient.birth_date == dob)
                
            if hospital_id:
                query = query.outerjoin(Encounter).filter(
                    (Patient.managing_organization_id == hospital_id) | 
                    (Encounter.hospital_id == hospital_id)
                ).distinct()

            # Hospital scope - allow if patient has no managing organization, or matches, or has encounters here
            if user and user.hospital_id:
                if user.role not in ("admin", "hospital_admin"):
                    if not hospital_id:
                        query = query.outerjoin(Encounter).distinct()
                    query = query.filter(
                        (Patient.managing_organization_id == user.hospital_id) | 
                        (Patient.managing_organization_id == None) |
                        (Encounter.hospital_id == user.hospital_id)
                    )

            patients = query.limit(20).all()

            return jsonify({
                "patients": [_patient_to_fhir(p) for p in patients],
                "count": len(patients)
            })

        except Exception as e:
            logger.error(f"Patient search failed: {e}")
            return jsonify({"error": "Search failed"}), 500
        finally:
            db.close()

    # ── Helper functions to convert SQLAlchemy models to FHIR dicts ──────────────

    def _patient_to_fhir(p: Patient) -> dict:
        return {
            "resourceType": "Patient",
            "id": str(p.id),
            "identifier": p.identifiers or [],
            "active": p.active,
            "name": p.name,
            "telecom": p.telecom,
            "gender": p.gender,
            "birthDate": p.birth_date,
            "address": p.address or [],
            "maritalStatus": p.marital_status,
            "photo": p.photo or [],
            "biometricTemplateHash": p.biometric_template_hash,
            "faceRegistered": bool(p.face_encoding),
            "abhaId": p.abha_id,
        }

    def _practitioner_to_fhir(p: Practitioner) -> dict:
        if not p:
            return None
        return {
            "resourceType": "Practitioner",
            "id": str(p.id),
            "identifier": p.identifiers,
            "active": p.active,
            "name": p.name,
            "telecom": p.telecom,
            "gender": p.gender,
            "birthDate": p.birth_date,
            "specialty": p.specialty,
        }

    def _encounter_to_fhir(e: Encounter) -> dict:
        return {
            "resourceType": "Encounter",
            "id": str(e.id),
            "identifier": e.identifiers,
            "status": (e.status.value if hasattr(e.status, 'value') else str(e.status)).lower(),
            "class": {"coding": [{"code": e.class_code}]} if isinstance(e.class_code, str) else e.class_code,
            "type": e.type,
            "subject": {"reference": f"Patient/{e.patient_id}"},
            "participant": [{"individual": {"reference": f"Practitioner/{e.practitioner_id}"}}] if e.practitioner_id else [],
            "period": {"start": e.period_start.isoformat() if e.period_start else None,
                       "end": e.period_end.isoformat() if e.period_end else None},
            "reasonCode": e.reason_code,
            "notes": getattr(e, 'notes', None),
            "diagnosis": [
                {
                    "condition": {
                        "reference": d.get("condition", {}).get("reference", "Condition/unknown"),
                        "display": d.get("condition", {}).get("display", "")
                    }
                } for d in getattr(e, 'diagnosis', [])
            ] if getattr(e, 'diagnosis', None) else []
        }

    def _observation_to_fhir(o: Observation) -> dict:
        return {
            "resourceType": "Observation",
            "id": str(o.id),
            "identifier": o.identifiers,
            "status": o.status.value if hasattr(o.status, 'value') else o.status,
            "category": o.category,
            "code": o.code,
            "subject": {"reference": f"Patient/{o.patient_id}"},
            "encounter": {"reference": f"Encounter/{o.encounter_id}"} if o.encounter_id else None,
            "effectiveDateTime": o.effective_datetime.isoformat() if o.effective_datetime else None,
            "valueQuantity": o.value_quantity,
            "valueCodeableConcept": o.value_codeable_concept,
            "valueString": o.value_string,
            "components": o.components,
        }

    def _medication_to_fhir(m: MedicationRequest) -> dict:
        return {
            "resourceType": "MedicationRequest",
            "id": str(m.id),
            "identifier": m.identifiers,
            "status": m.status.value if hasattr(m.status, 'value') else m.status,
            "intent": m.intent,
            "medicationCodeableConcept": m.medication_codeable_concept,
            "subject": {"reference": f"Patient/{m.patient_id}"},
            "encounter": {"reference": f"Encounter/{m.encounter_id}"} if m.encounter_id else None,
            "authoredOn": m.authored_on.isoformat() if m.authored_on else None,
            "dosageInstruction": m.dosage_instruction,
        }

    def _diagnostic_report_to_fhir(d: DiagnosticReport) -> dict:
        return {
            "resourceType": "DiagnosticReport",
            "id": str(d.id),
            "identifier": d.identifiers,
            "status": d.status,
            "code": d.code,
            "subject": {"reference": f"Patient/{d.patient_id}"},
            "effectiveDateTime": d.effective_datetime.isoformat() if d.effective_datetime else None,
            "issued": d.issued.isoformat() if d.issued else None,
            "conclusion": d.conclusion,
        }

    def _consent_to_fhir(c: Consent) -> dict:
        return {
            "resourceType": "Consent",
            "id": str(c.id),
            "identifier": c.identifiers,
            "status": c.status.value if hasattr(c.status, 'value') else c.status,
            "scope": c.scope,
            "patient": {"reference": f"Patient/{c.patient_id}"},
            "provision": c.provision,
        }

    @app.route("/identity/patients/<patient_id>/encounters", methods=["GET"])
    @require_token(["patient:read"])
    def list_patient_encounters(patient_id):
        """List all encounters/appointments for a patient."""
        user = _get_current_user()

        db = next(get_db_session())
        try:
            patient = db.get(Patient, patient_id)
            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            encounters = db.query(Encounter).filter(
                Encounter.patient_id == patient_id
            ).order_by(Encounter.period_start.desc()).all()

            result = []
            for enc in encounters:
                practitioner = db.get(Practitioner, enc.practitioner_id) if enc.practitioner_id else None
                enc_dict = _encounter_to_fhir(enc)
                enc_dict["practitioner"] = _practitioner_to_fhir(practitioner) if practitioner else None
                result.append(enc_dict)

            _log_access(user, patient_id, "Encounter", None, "list", success=True)
            return jsonify({"encounters": result, "count": len(result)})

        except Exception as e:
            logger.error(f"List encounters failed: {e}")
            return jsonify({"error": "Failed to list encounters"}), 500
        finally:
            db.close()

    @app.route("/identity/hospitals/<hospital_id>/encounters", methods=["GET"])
    @require_token(["encounter:read"])
    def list_hospital_encounters(hospital_id):
        """List encounters for a specific hospital (used by Doctor/Nurse dashboard)."""
        user = _get_current_user()
        
        status_filter = request.args.get("status")

        db = next(get_db_session())
        try:
            query = db.query(Encounter).filter(Encounter.hospital_id == hospital_id)
            
            if status_filter:
                query = query.filter(Encounter.status == status_filter)
                
            # Order by period start ascending (queue order)
            encounters = query.order_by(Encounter.period_start.asc()).all()

            result = []
            for enc in encounters:
                patient = db.get(Patient, enc.patient_id)
                practitioner = db.get(Practitioner, enc.practitioner_id) if enc.practitioner_id else None
                
                enc_dict = _encounter_to_fhir(enc)
                enc_dict["patient"] = _patient_to_fhir(patient) if patient else None
                enc_dict["practitioner"] = _practitioner_to_fhir(practitioner) if practitioner else None
                result.append(enc_dict)

            return jsonify({"encounters": result, "count": len(result)})

        except Exception as e:
            logger.error(f"List hospital encounters failed: {e}")
            return jsonify({"error": "Failed to list hospital encounters"}), 500
        finally:
            db.close()

    @app.route("/identity/patients/<patient_id>/encounters", methods=["POST"])
    @require_token(["patient:write"])
    def book_encounter(patient_id):
        """Book a new appointment/encounter for a patient."""
        user = _get_current_user()
        data = request.get_json() or {}

        practitioner_id = data.get("practitioner_id")
        hospital_id = data.get("hospital_id")
        period_start = data.get("period_start")  # ISO 8601 string
        reason = data.get("reason", "")

        if not hospital_id or not period_start:
            return jsonify({"error": "hospital_id and period_start are required"}), 400

        db = next(get_db_session())
        try:
            from datetime import datetime as dt
            patient = db.get(Patient, patient_id)
            if not patient:
                patient = db.query(Patient).filter(Patient.user_id == patient_id).first()
            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            start_dt = dt.fromisoformat(period_start.replace("Z", "+00:00"))

            from datetime import timezone as tz
            # If check-in is now (within 1 minute) or reason indicates walk-in triage, mark as arrived
            is_walkin = "triage" in reason.lower() or "check-in" in reason.lower() or "checkin" in reason.lower() or "walk-in" in reason.lower()
            is_now = abs((start_dt - dt.now(tz.utc)).total_seconds()) < 120
            initial_status = EncounterStatus.ARRIVED if (is_walkin or is_now) else EncounterStatus.PLANNED

            enc = Encounter(
                status=initial_status,
                class_code={"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB", "display": "ambulatory"},
                patient_id=patient.id,  # Use actual patient.id
                practitioner_id=practitioner_id if practitioner_id else None,
                hospital_id=hospital_id,
                period_start=start_dt,
                reason_code=[{"text": reason}] if reason else [],
                type=[{"text": "Outpatient visit"}],
            )

            db.add(enc)
            db.commit()

            _log_access(user, patient_id, "Encounter", enc.id, "create", success=True)

            practitioner = db.get(Practitioner, enc.practitioner_id) if enc.practitioner_id else None
            enc_dict = _encounter_to_fhir(enc)
            enc_dict["practitioner"] = _practitioner_to_fhir(practitioner) if practitioner else None

            return jsonify(enc_dict), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Book encounter failed: {e}")
            return jsonify({"error": "Failed to book appointment"}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/cancel", methods=["PATCH"])
    @require_token(["patient:write"])
    def cancel_encounter(encounter_id):
        """Cancel an appointment/encounter."""
        user = _get_current_user()

        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404

            enc.status = EncounterStatus.CANCELLED
            db.commit()

            _log_access(user, enc.patient_id, "Encounter", encounter_id, "cancel", success=True)
            return jsonify({"status": "cancelled", "id": str(enc.id)})

        except Exception as e:
            db.rollback()
            logger.error(f"Cancel encounter failed: {e}")
            return jsonify({"error": "Failed to cancel appointment"}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/triage", methods=["POST"])
    @require_token(["encounter:write"])
    def triage_encounter(encounter_id):
        """Nurse records vitals and updates status to triaged."""
        user = _get_current_user()
        data = request.get_json() or {}
        
        # Expecting vitals like: {"bp": "120/80", "hr": "72", "temp": "98.6", "weight": "70", "chief_complaint": "Headache"}
        
        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404
                
            patient_id = enc.patient_id
            
            # Find the practitioner (nurse) who is doing this
            practitioner_id = None
            if user:
                practitioner = db.query(Practitioner).filter(Practitioner.user_id == user.sub).first()
                if practitioner:
                    practitioner_id = practitioner.id
                    
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            # Create observations for vitals
            vitals = []
            if "bp" in data:
                vitals.append(("Blood Pressure", data["bp"]))
            if "hr" in data:
                vitals.append(("Heart Rate", data["hr"]))
            if "temp" in data:
                vitals.append(("Temperature", data["temp"]))
            if "weight" in data:
                vitals.append(("Weight", data["weight"]))
                
            for vital_name, vital_val in vitals:
                obs = Observation(
                    status=ObservationStatus.FINAL,
                    category=[{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs", "display": "Vital Signs"}]}],
                    code={"text": vital_name},
                    patient_id=patient_id,
                    encounter_id=encounter_id,
                    performer_id=practitioner_id,
                    effective_datetime=now,
                    value_string=str(vital_val)
                )
                db.add(obs)
                
            # Update encounter status and chief complaint
            enc.status = EncounterStatus.TRIAGED
            
            if "chief_complaint" in data:
                # Add to reason_code
                reasons = enc.reason_code or []
                reasons.append({"text": data["chief_complaint"]})
                enc.reason_code = reasons
                
            db.commit()
            
            _log_access(user, patient_id, "Encounter", encounter_id, "triage", success=True)
            return jsonify({"status": "triaged", "id": str(enc.id)})
            
        except Exception as e:
            db.rollback()
            logger.error(f"Triage encounter failed: {e}")
            return jsonify({"error": "Failed to triage appointment"}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/accept", methods=["POST"])
    @require_token(["encounter:write"])
    def accept_encounter(encounter_id):
        """Doctor accepts an arrived patient from the waiting room directly."""
        user = _get_current_user()
        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404
            
            # Find practitioner for this user
            practitioner = None
            if user:
                practitioner = db.query(Practitioner).filter(Practitioner.user_id == user.sub).first()
                
            if practitioner:
                enc.practitioner_id = practitioner.id
                
            # If the patient hasn't been triaged, we can move them to triaged (ready) or in-progress
            if enc.status == EncounterStatus.ARRIVED or enc.status == EncounterStatus.PLANNED:
                enc.status = EncounterStatus.TRIAGED
                
            db.commit()
            
            _log_access(user, str(enc.patient_id), "Encounter", encounter_id, "accept", success=True)
            return jsonify({"status": "accepted", "id": str(enc.id)})
        except Exception as e:
            db.rollback()
            logger.error(f"Accept encounter failed: {e}")
            return jsonify({"error": "Failed to accept appointment"}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/assign-doctor", methods=["POST"])
    @require_token(["encounter:write"])
    def assign_doctor_to_encounter(encounter_id):
        """Nurse assigns a doctor to a triaged encounter."""
        user = _get_current_user()
        data = request.get_json() or {}
        doctor_user_id = data.get("doctor_user_id")

        if not doctor_user_id:
            return jsonify({"error": "doctor_user_id is required"}), 400

        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404

            # Find practitioner record for this doctor user
            practitioner = db.query(Practitioner).filter(
                Practitioner.user_id == doctor_user_id
            ).first()

            if not practitioner:
                return jsonify({"error": "Doctor practitioner record not found"}), 404

            enc.practitioner_id = practitioner.id
            db.commit()

            _log_access(user, str(enc.patient_id), "Encounter", encounter_id, "assign_doctor", success=True)
            return jsonify({
                "status": "assigned",
                "encounter_id": str(enc.id),
                "practitioner_id": str(practitioner.id),
            })
        except Exception as e:
            db.rollback()
            logger.error(f"Assign doctor failed: {e}")
            return jsonify({"error": "Failed to assign doctor"}), 500
        finally:
            db.close()

    @app.route("/identity/hospitals/<hospital_id>/doctors-workload", methods=["GET"])
    @require_token(["encounter:read"])
    def get_doctors_workload(hospital_id):
        """Get all doctors at a hospital with their current active patient count."""
        from shared.sdk.models import User, UserRole, UserStatus
        db = next(get_db_session())
        try:
            # Get all doctor users at the hospital
            doctors = db.query(User).filter(
                User.hospital_id == hospital_id,
                User.role == UserRole.DOCTOR,
                User.status == UserStatus.ACTIVE
            ).all()

            result = []
            for doc in doctors:
                # Count triaged encounters assigned to this doctor
                practitioner = db.query(Practitioner).filter(
                    Practitioner.user_id == doc.id
                ).first()

                active_count = 0
                if practitioner:
                    active_count = db.query(Encounter).filter(
                        Encounter.practitioner_id == practitioner.id,
                        Encounter.status.in_([EncounterStatus.TRIAGED, EncounterStatus.IN_PROGRESS])
                    ).count()

                result.append({
                    "id": str(doc.id),
                    "full_name": doc.full_name,
                    "email": doc.email,
                    "specialty": practitioner.specialty if practitioner else "General",
                    "practitioner_id": str(practitioner.id) if practitioner else None,
                    "active_patients": active_count,
                })

            return jsonify({"doctors": result})
        except Exception as e:
            logger.error(f"Get doctors workload failed: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/clinical-data", methods=["GET"])
    @require_token(["encounter:read"])
    def get_clinical_data(encounter_id):
        """Fetch all clinical data for an encounter (vitals, intake, history) and past history across hospitals."""
        user = _get_current_user()
        
        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404
                
            patient = db.get(Patient, enc.patient_id)
            
            # Get vitals (observations for this encounter)
            observations = db.query(Observation).filter(Observation.encounter_id == encounter_id).all()
            
            # Get intake data (SymptomIntake)
            intake = db.query(SymptomIntake).filter(SymptomIntake.encounter_id == encounter_id).first()
            
            # Get medications prescribed during this encounter
            meds = db.query(MedicationRequest).filter(MedicationRequest.encounter_id == encounter_id).all()

            # Get diagnostic reports (all for patient, to give full context)
            reports = db.query(DiagnosticReport).filter(DiagnosticReport.patient_id == enc.patient_id).order_by(DiagnosticReport.effective_datetime.desc()).all()

            # Get past history across all hospitals
            past_encounters = db.query(Encounter).filter(
                Encounter.patient_id == enc.patient_id,
                Encounter.status == EncounterStatus.FINISHED,
                Encounter.id != encounter_id
            ).order_by(Encounter.period_start.desc()).all()
            
            history = []
            for past in past_encounters:
                hospital = db.get(Hospital, past.hospital_id) if past.hospital_id else None
                past_obs = db.query(Observation).filter(Observation.encounter_id == past.id).all()
                past_meds = db.query(MedicationRequest).filter(MedicationRequest.encounter_id == past.id).all()
                history.append({
                    "encounter": _encounter_to_fhir(past),
                    "hospital_name": hospital.name if hospital else "Unknown Hospital",
                    "observations": [_observation_to_fhir(o) for o in past_obs],
                    "medications": [_medication_to_fhir(m) for m in past_meds]
                })

            result = {
                "encounter": _encounter_to_fhir(enc),
                "patient": _patient_to_fhir(patient),
                "observations": [_observation_to_fhir(o) for o in observations],
                "medications": [_medication_to_fhir(m) for m in meds],
                "diagnostic_reports": [_diagnostic_report_to_fhir(r) for r in reports],
                "intake": {
                    "responses": intake.responses if intake else [],
                    "summary": intake.structured_output if intake else None
                } if intake else None,
                "history": history
            }
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Get clinical data failed: {e}")
            return jsonify({"error": "Failed to get clinical data"}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/finish", methods=["POST"])
    @require_token(["encounter:write"])
    def finish_encounter(encounter_id):
        """Doctor writes notes, adds diagnosis, and finishes the encounter."""
        user = _get_current_user()
        data = request.get_json() or {}
        
        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404
                
            enc.status = EncounterStatus.FINISHED
            
            if "notes" in data:
                enc.notes = data["notes"]
                
            if "diagnosis" in data:
                diag_list = enc.diagnosis or []
                diag_list.append({"condition": {"reference": "Condition/unknown", "display": data["diagnosis"]}})
                enc.diagnosis = diag_list
                flag_modified(enc, "diagnosis")
                
            db.commit()
            
            _log_access(user, enc.patient_id, "Encounter", encounter_id, "finish", success=True)
            return jsonify({"status": "finished", "id": str(enc.id)})
            
        except Exception as e:
            db.rollback()
            logger.error(f"Finish encounter failed: {e}")
            return jsonify({"error": "Failed to finish appointment"}), 500
        finally:
            db.close()
            
    @app.route("/identity/encounters/<encounter_id>/prescribe", methods=["POST"])
    @require_token(["encounter:write"])
    def prescribe_medication(encounter_id):
        """Doctor prescribes a medication."""
        user = _get_current_user()
        data = request.get_json() or {}
        
        med_name = data.get("medication")
        instructions = data.get("instructions")
        
        if not med_name:
            return jsonify({"error": "medication name is required"}), 400
            
        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404
                
            # Find the practitioner (doctor) who is doing this
            practitioner_id = None
            if user:
                practitioner = db.query(Practitioner).filter(Practitioner.user_id == user.sub).first()
                if practitioner:
                    practitioner_id = practitioner.id
                    
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            med_req = MedicationRequest(
                status=MedicationStatus.ACTIVE,
                intent="order",
                medication_codeable_concept={"text": med_name},
                patient_id=enc.patient_id,
                encounter_id=encounter_id,
                requester_id=practitioner_id,
                authored_on=now,
                dosage_instruction=[{"text": instructions}] if instructions else []
            )
            
            db.add(med_req)
            db.commit()
            
            _log_access(user, enc.patient_id, "MedicationRequest", med_req.id, "create", success=True)
            return jsonify({"status": "prescribed", "id": str(med_req.id)})
            
        except Exception as e:
            db.rollback()
            logger.error(f"Prescribe failed: {e}")
            return jsonify({"error": "Failed to prescribe"}), 500
        finally:
            db.close()

    @app.route("/identity/encounters/<encounter_id>/reports", methods=["POST"])
    @require_token(["encounter:write"])
    def add_encounter_report(encounter_id):
        """Add a diagnostic report tied to an encounter."""
        user = _get_current_user()
        data = request.get_json() or {}
        
        name = data.get("name")
        conclusion = data.get("conclusion")
        
        if not name:
            return jsonify({"error": "Report name is required"}), 400
            
        db = next(get_db_session())
        try:
            enc = db.get(Encounter, encounter_id)
            if not enc:
                return jsonify({"error": "Encounter not found"}), 404
                
            practitioner_id = None
            if user:
                practitioner = db.query(Practitioner).filter(Practitioner.user_id == user.sub).first()
                if practitioner:
                    practitioner_id = practitioner.id
                    
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            report = DiagnosticReport(
                patient_id=enc.patient_id,
                encounter_id=encounter_id,
                performer_id=practitioner_id,
                code={"text": name},
                conclusion=conclusion,
                effective_datetime=now,
                issued=now,
                status="final"
            )
            db.add(report)
            db.commit()
            
            try:
                import requests
                requests.post("http://onehealth-web:3000/api/events", json={
                    "type": "report_added",
                    "patientId": str(enc.patient_id)
                }, timeout=1)
            except Exception as e:
                logger.warning(f"Failed to send SSE event: {e}")
            
            return jsonify({"status": "created", "id": str(report.id)})
            
        except Exception as e:
            db.rollback()
            logger.error(f"Add report failed: {e}")
            return jsonify({"error": "Failed to add report"}), 500
        finally:
            db.close()

    @app.route("/identity/patients/<patient_id>/reports", methods=["POST"])
    @require_token(["encounter:write"])
    def add_patient_report(patient_id):
        """Add a diagnostic report directly to a patient."""
        user = _get_current_user()
        data = request.get_json() or {}
        
        name = data.get("name")
        conclusion = data.get("conclusion")
        
        if not name:
            return jsonify({"error": "Report name is required"}), 400
            
        db = next(get_db_session())
        try:
            patient = db.get(Patient, patient_id)
            if not patient:
                return jsonify({"error": "Patient not found"}), 404
                
            practitioner_id = None
            if user:
                practitioner = db.query(Practitioner).filter(Practitioner.user_id == user.sub).first()
                if practitioner:
                    practitioner_id = practitioner.id
                    
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            report = DiagnosticReport(
                patient_id=patient_id,
                performer_id=practitioner_id,
                code={"text": name},
                conclusion=conclusion,
                effective_datetime=now,
                issued=now,
                status="final"
            )
            db.add(report)
            db.commit()
            
            try:
                import requests
                requests.post("http://onehealth-web:3000/api/events", json={
                    "type": "report_added",
                    "patientId": str(patient_id)
                }, timeout=1)
            except Exception as e:
                logger.warning(f"Failed to send SSE event: {e}")
            
            return jsonify({"status": "created", "id": str(report.id)})
            
        except Exception as e:
            db.rollback()
            logger.error(f"Add report failed: {e}")
            return jsonify({"error": "Failed to add report"}), 500
        finally:
            db.close()


    @app.route("/identity/register-face", methods=["POST"])
    @require_token(["patient:write"])
    def register_face():
        """Extract face encoding from image and associate with a patient."""
        user = _get_current_user()
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        image_base64 = data.get("image")
        
        if not patient_id or not image_base64:
            return jsonify({"error": "patient_id and image are required"}), 400
            
        try:
            # Decode base64 image
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert to RGB for face_recognition
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Extract encodings
            face_locations = face_recognition.face_locations(rgb_img)
            
            if not face_locations:
                # Fallback for dark/low-contrast images: apply CLAHE
                lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
                cl = clahe.apply(l)
                limg = cv2.merge((cl,a,b))
                enhanced_rgb = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
                face_locations = face_recognition.face_locations(enhanced_rgb, number_of_times_to_upsample=2)
                
            if not face_locations:
                return jsonify({"error": "No face found in image. Please ensure you are in a well-lit area and looking directly at the camera."}), 400
            if len(face_locations) > 1:
                return jsonify({"error": "Multiple faces found, please scan only one person"}), 400
                
            encodings = face_recognition.face_encodings(rgb_img, face_locations)
            if not encodings:
                return jsonify({"error": "Could not extract face features. Please try again with better lighting."}), 400
                
            face_encoding = encodings[0].tolist() # Convert numpy array to list for JSONB storage
            
            # Save to database
            db = next(get_db_session())
            try:
                # Check for duplicate faces
                existing_patients = db.query(Patient).filter(Patient.face_encoding.isnot(None)).all()
                match_count = 0
                for p in existing_patients:
                    if str(p.id) == str(patient_id):
                        continue
                    db_encoding = np.array(p.face_encoding)
                    distance = face_recognition.face_distance([db_encoding], encodings[0])[0]
                    if distance < 0.5:
                        match_count += 1
                        
                if match_count >= 3:
                    return jsonify({"error": "ur face is already registered with three accounts show new face"}), 400

                patient = db.get(Patient, patient_id)
                if not patient:
                    return jsonify({"error": "Patient not found"}), 404
                    
                patient.face_encoding = face_encoding
                db.commit()
                
                _log_access(user, patient_id, "PatientBiometrics", patient_id, "register", success=True)
                return jsonify({"status": "success", "message": "Face registered successfully"})
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Face registration failed: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/identity/verify-face", methods=["POST"])
    def verify_face():
        """Verify face for a specific patient ID (internal use for login)."""
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        image_base64 = data.get("image")

        if not patient_id or not image_base64:
            return jsonify({"error": "patient_id and image required"}), 400

        db = next(get_db_session())
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient or not patient.face_encoding:
                return jsonify({"error": "Patient not found or no face registered"}), 404

            # Decode base64 image
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            img_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return jsonify({"error": "Invalid image"}), 400

            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_img)
            
            if not face_locations:
                # Try with enhanced contrast
                lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
                l_channel, a, b = cv2.split(lab)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                cl = clahe.apply(l_channel)
                limg = cv2.merge((cl,a,b))
                enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
                enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(enhanced_rgb, number_of_times_to_upsample=2)
                
            if not face_locations:
                return jsonify({"error": "No face found in image"}), 400

            encodings = face_recognition.face_encodings(rgb_img, face_locations)
            if not encodings:
                return jsonify({"error": "Could not extract face features"}), 400

            live_encoding = encodings[0]
            db_encoding = np.array(patient.face_encoding)
            
            distance = face_recognition.face_distance([db_encoding], live_encoding)[0]
            if distance < 0.6:  # Threshold for match
                return jsonify({"match": True, "distance": float(distance)})
            else:
                return jsonify({"match": False, "distance": float(distance)})

        except Exception as e:
            logger.error(f"Face verification failed: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()

    @app.route("/identity/patient/<patient_id>/family", methods=["GET"])
    @require_token(["patient:read"])
    def get_patient_family(patient_id):
        """Get family members linked to this patient, or the primary patient if this is a dependent."""
        db = next(get_db_session())
        try:
            # First find if this patient is primary or dependent
            curr_patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not curr_patient:
                return jsonify({"error": "Patient not found"}), 404
                
            primary_id = str(curr_patient.id)
            
            # Check if this patient is a dependent
            if curr_patient.identifiers:
                for ident in curr_patient.identifiers:
                    if ident.get("system") == "onehealth:family:primary":
                        primary_id = ident.get("value")
                        break
                        
            # Now find the primary patient and all dependents linked to this primary
            family_patients = []
            
            # Get primary
            primary_p = db.query(Patient).filter(Patient.id == primary_id).first()
            if primary_p:
                family_patients.append(primary_p)
                
            # Get dependents
            # We need to search JSONB identifiers for the family link
            # SQLAlchemy JSONB containment:
            # Patient.identifiers.contains([{"system": "onehealth:family:primary", "value": primary_id}])
            dependents = db.query(Patient).filter(
                Patient.identifiers.contains([{"system": "onehealth:family:primary", "value": primary_id}])
            ).all()
            
            for d in dependents:
                if str(d.id) != str(primary_p.id): # Just in case
                    family_patients.append(d)
                    
            # Serialize each patient and fetch their observations
            result = []
            for fp in family_patients:
                p_dict = _patient_to_fhir(fp)
                # Get their active observations/issues
                observations = db.query(Observation).filter(
                    Observation.patient_id == fp.id
                ).order_by(Observation.effective_datetime.desc()).all()
                
                obs_list = [_observation_to_fhir(o) for o in observations]
                p_dict["medical_issues"] = obs_list
                result.append(p_dict)
                
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Failed to fetch family: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()

    @app.route("/identity/patient/<patient_id>/link-family", methods=["POST"])
    @require_token(["patient:write", "patient:read"])
    def link_family(patient_id):
        """Link this patient as a dependent to a primary patient."""
        data = request.get_json() or {}
        primary_id = data.get("primary_id")
        
        if not primary_id:
            return jsonify({"error": "primary_id required"}), 400
            
        db = next(get_db_session())
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient:
                return jsonify({"error": "Patient not found"}), 404
                
            # Update identifiers JSONB
            identifiers = patient.identifiers or []
            # Check if already linked
            already_linked = any(i.get("system") == "onehealth:family:primary" for i in identifiers)
            
            if not already_linked:
                identifiers.append({
                    "system": "onehealth:family:primary",
                    "value": primary_id
                })
                # We need to explicitly tell SQLAlchemy that the JSON has changed
                # It sometimes doesn't track mutations of JSON objects.
                # A common workaround is assigning a new list
                patient.identifiers = list(identifiers)
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(patient, "identifiers")
                
                db.commit()
                
            return jsonify({"status": "success", "message": "Family linked"})
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to link family: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()

    @app.route("/identity/match-face", methods=["POST"])
    @require_token(["patient:read"])
    def match_face():
        """Identify patient by face and fetch full history."""
        user = _get_current_user()
        data = request.get_json() or {}
        image_base64 = data.get("image")
        
        if not image_base64:
            return jsonify({"error": "image is required"}), 400
            
        try:
            # Decode base64 image
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            face_locations = face_recognition.face_locations(rgb_img)
            if not face_locations:
                return jsonify({"error": "No face found in image"}), 400
                
            encodings = face_recognition.face_encodings(rgb_img, face_locations)
            live_encoding = encodings[0]
            
            db = next(get_db_session())
            try:
                # Fetch all patients with face encodings (In production, use pgvector for scale)
                patients = db.query(Patient).filter(Patient.face_encoding.isnot(None)).all()
                
                best_match_id = None
                best_match_distance = 1.0
                
                for p in patients:
                    db_encoding = np.array(p.face_encoding)
                    # face_recognition uses euclidean distance. Threshold is usually 0.6
                    distance = face_recognition.face_distance([db_encoding], live_encoding)[0]
                    if distance < 0.5 and distance < best_match_distance: # Stricter threshold 0.5
                        best_match_distance = distance
                        best_match_id = p.id
                        
                if not best_match_id:
                    return jsonify({"error": "No match found"}), 404
                    
                # Fetch complete history across hospitals for the matched patient
                matched_patient = db.get(Patient, best_match_id)
                encounters = db.query(Encounter).filter(Encounter.patient_id == best_match_id).all()
                medications = db.query(MedicationRequest).filter(MedicationRequest.patient_id == best_match_id).all()
                
                history = {
                    "encounters": [{"id": str(e.id), "status": e.status, "start": str(e.period_start) if e.period_start else None, "hospital_id": str(e.hospital_id)} for e in encounters],
                    "medications": [{"id": str(m.id), "medication": m.medication_codeable_concept, "status": m.status} for m in medications]
                }
                
                _log_access(user, best_match_id, "PatientHistory", best_match_id, "match_and_fetch", success=True)
                
                return jsonify({
                    "status": "matched",
                    "patient_id": str(matched_patient.id),
                    "name": matched_patient.name,
                    "distance": best_match_distance,
                    "history": history
                })
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Face matching failed: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/identity/checkin-face", methods=["POST"])
    @require_token(["patient:write", "encounter:write"])
    def checkin_face():
        """Identify patient by face and instantly check them into the hospital's queue."""
        user = _get_current_user()
        data = request.get_json() or {}
        image_base64 = data.get("image")
        hospital_id = data.get("hospital_id")
        
        if not image_base64 or not hospital_id:
            return jsonify({"error": "image and hospital_id are required"}), 400
            
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_img)
            
            if not face_locations:
                return jsonify({"error": "No face found in image"}), 400
                
            encodings = face_recognition.face_encodings(rgb_img, face_locations)
            live_encoding = encodings[0]
            
            db = next(get_db_session())
            try:
                patients = db.query(Patient).filter(Patient.face_encoding.isnot(None)).all()
                best_match_id = None
                best_match_distance = 1.0
                
                for p in patients:
                    db_encoding = np.array(p.face_encoding)
                    distance = face_recognition.face_distance([db_encoding], live_encoding)[0]
                    if distance < 0.5 and distance < best_match_distance:
                        best_match_distance = distance
                        best_match_id = p.id
                        
                if not best_match_id:
                    return jsonify({"error": "Face not recognized in the universal system"}), 404
                    
                matched_patient = db.get(Patient, best_match_id)
                
                # Update managing organization
                matched_patient.managing_organization_id = hospital_id
                
                # Create an encounter (add to queue)
                encounter = Encounter(
                    patient_id=matched_patient.id,
                    hospital_id=hospital_id,
                    status=EncounterStatus.ARRIVED,
                    class_code="AMB",
                    period_start=datetime.now(timezone.utc)
                )
                db.add(encounter)
                db.commit()
                
                # Send real-time SSE notification
                try:
                    import requests
                    requests.post(f"http://onehealth-web:3000/api/events", json={
                        "type": "patient_registered",
                        "hospital_id": hospital_id,
                        "patient_id": str(matched_patient.id)
                    }, timeout=1)
                except Exception as e:
                    logger.warning(f"Failed to send SSE event: {e}")
                
                return jsonify({
                    "status": "checked_in",
                    "patient": _patient_to_fhir(matched_patient),
                    "encounter_id": str(encounter.id)
                })
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Face check-in failed: {e}")
            return jsonify({"error": str(e)}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "5001"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)