import sys
import json
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import Patient
from shared.fhir.models import DiagnosticReport
db = next(get_db_session())
patient = db.get(Patient, "5538ae7e-de3a-4651-b52d-c39d4068a14b")

def _diagnostic_report_to_fhir(d) -> dict:
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

for d in patient.diagnostic_reports:
    fhir_dict = _diagnostic_report_to_fhir(d)
    print("Trying to parse:", json.dumps(fhir_dict, indent=2))
    try:
        report = DiagnosticReport(**fhir_dict)
        print("Success:", report.id)
    except Exception as e:
        print("Error parsing:", e)
