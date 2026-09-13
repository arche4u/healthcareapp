"""
OneHealth Intake AI Service
Self-hosted LLM (Ollama) + Whisper speech-to-text for symptom intake.
"""
import os
import logging
import json
from datetime import datetime, timezone
from typing import Optional

from flask import Flask, request, jsonify
from shared.sdk.auth import decode_token
from shared.sdk.database import get_db_session
from shared.fhir.models import SymptomIntakeResponse
from shared.sdk.models import Patient, Practitioner, Encounter, SymptomIntake

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI Service configuration (all have stub fallbacks)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
WHISPER_HOST = os.getenv("WHISPER_HOST", "http://localhost:9000")
USE_AI_FALLBACK = os.getenv("USE_AI_FALLBACK", "false").lower() == "true"

# The 10-question symptom intake flow
SYMPTOM_INTAKE_QUESTIONS = [
    {"id": "chief_complaint", "text": "What brings you here today?", "type": "text", "required": True},
    {"id": "pain_location", "text": "Where is the pain/discomfort located?", "type": "text", "required": False},
    {"id": "pain_severity", "text": "Rate your pain on a scale of 1-10", "type": "scale", "min": 1, "max": 10, "required": True},
    {"id": "duration", "text": "How long have you had this symptom?", "type": "text", "required": True},
    {"id": "onset", "text": "What makes the symptom better or worse?", "type": "text", "required": False},
    {"id": "associated_fever", "text": "Do you have fever or chills?", "type": "boolean", "required": False},
    {"id": "associated_nausea", "text": "Do you have nausea or vomiting?", "type": "boolean", "required": False},
    {"id": "breathing", "text": "Are you having trouble breathing?", "type": "boolean", "required": False},
    {"id": "previous_history", "text": "Have you had similar symptoms before?", "type": "boolean", "required": False},
    {"id": "medical_history", "text": "Any known medical conditions (e.g., diabetes, hypertension)?", "type": "text", "required": False},
]

# Specialty routing rules
SPECIALTY_ROUTING = {
    "chest pain": "cardiology",
    "breathless": "cardiology",
    "shortness of breath": "cardiology",
    "bp": "cardiology",
    "headache": "neurology",
    "dizziness": "neurology",
    "weakness": "neurology",
    "abdominal pain": "gastroenterology",
    "nausea": "gastroenterology",
    "joint pain": "orthopedics",
    "fracture": "orthopedics",
    "rash": "dermatology",
    "fever": "general medicine",
    "cough": "general medicine",
}


def create_app():
    app = Flask(__name__)

    @app.route("/intake/health")
    def health():
        return jsonify({"status": "ok", "service": "intake-ai-svc"})

    def _get_current_user():
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        return decode_token(token)

    @app.route("/intake/questions", methods=["GET"])
    def get_questions():
        """Get all 10 intake questions."""
        return jsonify({
            "questions": SYMPTOM_INTAKE_QUESTIONS,
            "version": "1.0",
            "supported_languages": ["en", "hi", "ta", "te", "bn", "mr"],
        })

    @app.route("/intake/start", methods=["POST"])
    def start_intake():
        """Start a new symptom intake session."""
        user = _get_current_user()
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        hospital_id = data.get("hospital_id")
        encounter_id = data.get("encounter_id")

        if not patient_id:
            return jsonify({"error": "patient_id required"}), 400

        db = next(get_db_session())
        try:
            session_id = f"intake-{patient_id[:8]}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

            intake = SymptomIntake(
                patient_id=patient_id,
                encounter_id=encounter_id,
                session_id=session_id,
                current_question=0,
                completed=False,
                responses=[],
            )
            db.add(intake)
            db.commit()

            logger.info(f"Started intake session: {session_id} for patient {patient_id}")

            return jsonify({
                "session_id": session_id,
                "current_question": 0,
                "question": SYMPTOM_INTAKE_QUESTIONS[0],
                "remaining_questions": len(SYMPTOM_INTAKE_QUESTIONS) - 1,
            }), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Start intake failed: {e}")
            return jsonify({"error": "Failed to start intake"}), 500
        finally:
            db.close()

    @app.route("/intake/<session_id>/answer", methods=["POST"])
    def submit_answer(session_id):
        """Submit an answer to the current question."""
        user = _get_current_user()
        data = request.get_json() or {}
        answer = data.get("answer")

        db = next(get_db_session())
        try:
            intake = db.query(SymptomIntake).filter(SymptomIntake.session_id == session_id).first()
            if not intake:
                return jsonify({"error": "Session not found"}), 404

            if intake.completed:
                return jsonify({"error": "Intake already completed"}), 400

            # Record answer
            current_q = SYMPTOM_INTAKE_QUESTIONS[intake.current_question]
            intake.responses.append({
                "question_id": current_q["id"],
                "question_text": current_q["text"],
                "answer": answer,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Advance to next question
            if intake.current_question + 1 < len(SYMPTOM_INTAKE_QUESTIONS):
                intake.current_question += 1
                next_question = SYMPTOM_INTAKE_QUESTIONS[intake.current_question]
                db.commit()

                return jsonify({
                    "session_id": session_id,
                    "current_question": intake.current_question,
                    "question": next_question,
                    "remaining_questions": len(SYMPTOM_INTAKE_QUESTIONS) - intake.current_question - 1,
                })
            else:
                # All questions answered - process with AI
                intake.completed = True
                intake.completed_at = datetime.now(timezone.utc)
                db.commit()

                # Generate structured summary
                structured = _process_intake(intake.responses)

                # Save structured output
                intake.structured_output = structured.model_dump()
                db.commit()

                # Route to doctor
                specialty = _route_specialty(structured)

                logger.info(f"Intake complete: {session_id}, routed to {specialty}")

                return jsonify({
                    "session_id": session_id,
                    "status": "completed",
                    "structured_summary": structured.model_dump(by_alias=True),
                    "suggested_specialty": specialty,
                })

        except Exception as e:
            db.rollback()
            logger.error(f"Submit answer failed: {e}")
            return jsonify({"error": "Failed to submit answer"}), 500
        finally:
            db.close()

    @app.route("/intake/<session_id>/summary", methods=["GET"])
    def get_summary(session_id):
        """Get intake summary for a session."""
        db = next(get_db_session())
        try:
            intake = db.query(SymptomIntake).filter(SymptomIntake.session_id == session_id).first()
            if not intake:
                return jsonify({"error": "Session not found"}), 404

            return jsonify({
                "session_id": session_id,
                "responses": intake.responses,
                "completed": intake.completed,
                "completed_at": intake.completed_at.isoformat() if intake.completed_at else None,
                "structured_output": intake.structured_output,
            })

        finally:
            db.close()

    @app.route("/intake/speech", methods=["POST"])
    def speech_to_text():
        """Convert speech to text using Whisper (stubbed)."""
        user = _get_current_user()
        data = request.get_json() or {}
        audio_data = data.get("audio")  # base64 encoded WAV
        language = data.get("language", "en")

        if not audio_data:
            return jsonify({"error": "audio data required"}), 400

        if USE_AI_FALLBACK:
            import httpx
            try:
                response = httpx.post(
                    f"{WHISPER_HOST}/transcription",
                    json={"audio": audio_data, "language": language},
                    timeout=60,
                )
                result = response.json()
                return jsonify({"text": result.get("text", ""), "language": language})
            except Exception as e:
                logger.error(f"Whisper transcription failed: {e}")

        # STUB: Return placeholder
        logger.warning("Speech-to-text called - returning STUB result")
        return jsonify({
            "text": "STUB: Speech not processed. Whisper service would transcribe this audio.",
            "language": language,
            "stub": True
        })

    @app.route("/intake/llm/process", methods=["POST"])
    def llm_process():
        """Process responses with LLM to generate structured summary (stubbed)."""
        user = _get_current_user()
        data = request.get_json() or {}
        responses = data.get("responses", [])

        if USE_AI_FALLBACK:
            import httpx
            prompt = _build_llm_prompt(responses)
            try:
                response = httpx.post(
                    f"{OLLAMA_HOST}/v1/chat/completions",
                    json={
                        "model": "llama3",
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=60,
                )
                result = response.json()
                text = result["choices"][0]["message"]["content"]
                structured = _parse_llm_output(text)
                return jsonify(structured)
            except Exception as e:
                logger.error(f"Ollama processing failed: {e}")

        # STUB: Generate structured output from rules
        logger.warning("LLM processing called - returning STUB result")
        structured = _process_intake(responses)
        return jsonify({
            **structured.model_dump(by_alias=True),
            "stub": True
        })

    return app


def _build_llm_prompt(responses: list[dict]) -> str:
    """Build prompt for LLM to structure symptom intake."""
    response_text = "\n".join(
        f"Q: {r['question_id']} A: {r['answer']}" for r in responses
    )
    return f"""
You are a medical triage assistant. Given the following symptom intake responses,
extract and structure the following fields: chief_complaint, duration_days,
severity (mild/moderate/severe/critical), associated_symptoms (list), relevant_history (list),
red_flags (list), suggested_specialty, and confidence (0-1).

If you cannot determine a field, use a reasonable default or empty list.

Responses:
{response_text}

Return only valid JSON:
"""


def _parse_llm_output(text: str) -> dict:
    """Parse LLM output into structured dict."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {}
    return data


def _process_intake(responses: list[dict]) -> SymptomIntakeResponse:
    """Process symptom intake responses into structured output (rules-based stub)."""
    resp_map = {r["question_id"]: r["answer"] for r in responses}
    chief = str(resp_map.get("chief_complaint", "general consultation"))

    # Parse severity
    pain_severity = resp_map.get("pain_severity")
    if pain_severity:
        try:
            score = int(pain_severity)
            severity = "severe" if score >= 8 else "moderate" if score >= 5 else "mild"
        except (ValueError, TypeError):
            severity = "moderate"
    else:
        severity = "moderate"

    # Parse duration
    duration_text = str(resp_map.get("duration", ""))
    duration_days = 3
    if "day" in duration_text.lower():
        import re
        numbers = re.findall(r'\d+', duration_text)
        if numbers:
            duration_days = int(numbers[0])
    elif "week" in duration_text.lower():
        import re
        numbers = re.findall(r'\d+', duration_text)
        if numbers:
            duration_days = int(numbers[0]) * 7

    # Associated symptoms
    associated = []
    if resp_map.get("associated_fever", "").lower() in ("yes", "true", "1"):
        associated.append("fever/chills")
    if resp_map.get("associated_nausea", "").lower() in ("yes", "true", "1"):
        associated.append("nausea/vomiting")
    if resp_map.get("breathing", "").lower() in ("yes", "true", "1"):
        associated.append("breathlessness")

    # Red flags
    red_flags = []
    if severity == "severe" and duration_days < 3:
        red_flags.append("acute severe onset")
    if resp_map.get("breathing", "").lower() in ("yes", "true", "1"):
        red_flags.append("respiratory distress")

    # Relevant history
    relevant_history = []
    if resp_map.get("previous_history", "").lower() in ("yes", "true", "1"):
        relevant_history.append("similar symptoms previously reported")
    mh = resp_map.get("medical_history", "")
    if mh:
        relevant_history.append(mh)

    specialty = _route_specialty_by_symptom(chief)

    return SymptomIntakeResponse(
        chief_complaint=chief,
        duration_days=duration_days,
        severity=severity,
        associated_symptoms=associated,
        relevant_history=relevant_history,
        red_flags=red_flags,
        suggested_specialty=specialty,
        confidence=0.85,
    )


def _route_specialty(structured: SymptomIntakeResponse) -> Optional[str]:
    return structured.suggested_specialty


def _route_specialty_by_symptom(text: str) -> Optional[str]:
    """Route based on keywords (rule-based stub)."""
    text_lower = text.lower()
    for keyword, specialty in SPECIALTY_ROUTING.items():
        if keyword in text_lower:
            return specialty
    return "general medicine"


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "5002"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)