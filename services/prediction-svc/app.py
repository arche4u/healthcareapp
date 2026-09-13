"""
OneHealth Prediction Service
Next-visit prediction engine using rules (v1) → ML model (v1.5+).
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from flask import Flask, request, jsonify
from shared.sdk.auth import decode_token
from shared.sdk.database import get_db_session
from shared.sdk.models import Patient, Encounter, MedicationRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    @app.route("/predictions/health")
    def health():
        return jsonify({"status": "ok", "service": "prediction-svc"})

    def _get_current_user():
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        return decode_token(token)

    @app.route("/predictions/next-visit", methods=["POST"])
    def predict_next_visit():
        """
        Predict next-visit window based on diagnosis and doctor's historical patterns.
        v1: rules-based. v1.5+: ML model.
        """
        user = _get_current_user()
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        diagnosis_code = data.get("diagnosis_code")
        diagnosis_text = data.get("diagnosis_text", "")
        doctor_id = data.get("doctor_id")
        current_encounter_id = data.get("current_encounter_id")

        if not patient_id:
            return jsonify({"error": "patient_id required"}), 400

        db = next(get_db_session())
        try:
            # v1: Rules-based next-visit prediction
            prediction = _rules_based_prediction(
                diagnosis_code=diagnosis_code,
                diagnosis_text=diagnosis_text,
                doctor_id=doctor_id,
                db=db,
            )

            if not prediction:
                prediction = _default_prediction()

            return jsonify({
                "patient_id": str(patient_id),
                "prediction": prediction,
                "model": "rules-v1",
                "confidence": prediction.get("confidence", 0.5),
                "generated_at": datetime.now(timezone.utc).isoformat(),
            })

        except Exception as e:
            logger.error(f"Next-visit prediction failed: {e}")
            return jsonify({"error": "Prediction failed"}), 500
        finally:
            db.close()

    @app.route("/predictions/next-visit/hospital/<hospital_id>/patterns", methods=["GET"])
    def get_doctor_patterns(hospital_id):
        """Get a doctor's historical follow-up patterns (for prediction calibration)."""
        user = _get_current_user()
        doctor_id = request.args.get("doctor_id")

        # Hospital scope check
        if user and user.hospital_id != hospital_id:
            if user.role not in ("admin", "hospital_admin", "doctor"):
                return jsonify({"error": "Access denied"}), 403

        db = next(get_db_session())
        try:
            from datetime import func as sql_func
            from sqlalchemy import func

            # Get all completed encounters for this doctor
            encounters = db.query(Encounter).filter(
                Encounter.practitioner_id == doctor_id,
                Encounter.status == "finished",
                Encounter.hospital_id == hospital_id if user and user.hospital_id == hospital_id else True,
            ).all()

            # Calculate historical intervals between visits per diagnosis
            patterns = {}
            patient_visits: dict = {}

            for enc in encounters:
                pat_id = str(enc.patient_id)
                if pat_id not in patient_visits:
                    patient_visits[pat_id] = []
                # Get diagnosis (stored in encounter.notes or a separate diagnosis table)
                patient_visits[pat_id].append(enc.period_start)

            # Calculate intervals
            intervals = []
            for pat_id, dates in patient_visits.items():
                dates.sort()
                for i in range(1, len(dates)):
                    interval = (dates[i] - dates[i-1]).days
                    if 0 < interval < 365:  # reasonable range
                        intervals.append(interval)

            if intervals:
                import statistics
                avg_interval = statistics.mean(intervals)
                std_interval = statistics.stdev(intervals) if len(intervals) > 1 else 0
            else:
                avg_interval = 30
                std_interval = 7

            return jsonify({
                "doctor_id": str(doctor_id) if doctor_id else None,
                "hospital_id": str(hospital_id),
                "total_encounters": len(encounters),
                "avg_followup_interval_days": round(avg_interval, 1),
                "std_followup_interval_days": round(std_interval, 1),
                "min_interval": min(intervals) if intervals else None,
                "max_interval": max(intervals) if intervals else None,
            })

        finally:
            db.close()

    return app


# ─── Prediction logic ─────────────────────────────────────────────────────────

# Diagnosis-based follow-up intervals (days)
DIAGNOSIS_FOLLOWUP_INTERVALS = {
    # Cardiology
    "hypertension": (7, 30),  # BP check in 7 days, monthly follow-up
    "heart failure": (7, 14),
    "post-mi": (3, 7),
    # Diabetes
    "diabetes mellitus": (30, 90),
    "diabetic retinopathy": (30, 90),
    # Orthopedics
    "fracture": (7, 14),
    "post-op": (7, 14),
    "arthroplasty": (14, 30),
    # Neurology
    "stroke": (3, 7),
    "epilepsy": (90, 180),
    # Respiratory
    "copd": (30, 90),
    "asthma": (30, 90),
    # General
    "routine checkup": (90, 180),
    "acute URI": (7, 14),
}


def _rules_based_prediction(
    diagnosis_code: Optional[str],
    diagnosis_text: str,
    doctor_id: Optional[str],
    db,
) -> Optional[dict]:
    """Generate next-visit prediction based on diagnosis rules."""
    diagnosis_lower = diagnosis_text.lower()

    # Match against known diagnosis patterns
    for condition, (short_window, long_window) in DIAGNOSIS_FOLLOWUP_INTERVALS.items():
        if condition in diagnosis_lower:
            now = datetime.now(timezone.utc)
            return {
                "recommended_window_start": (now + timedelta(days=short_window)).date().isoformat(),
                "recommended_window_end": (now + timedelta(days=long_window)).date().isoformat(),
                "confidence": 0.75,
                "basis": f"diagnosis-based rules for '{condition}'",
                "rationale": f"Standard follow-up interval for {condition}: {short_window}-{long_window} days",
            }

    return None


def _default_prediction() -> dict:
    """Default prediction when no specific diagnosis pattern matches."""
    now = datetime.now(timezone.utc)
    return {
        "recommended_window_start": (now + timedelta(days=30)).date().isoformat(),
        "recommended_window_end": (now + timedelta(days=90)).date().isoformat(),
        "confidence": 0.50,
        "basis": "default heuristic",
        "rationale": "No specific diagnosis pattern; default 30-90 day follow-up window",
    }


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "5004"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)