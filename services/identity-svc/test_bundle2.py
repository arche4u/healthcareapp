import sys
import json
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import Patient
from shared.fhir.models import PatientBundle

db = next(get_db_session())
patient = db.get(Patient, "5538ae7e-de3a-4651-b52d-c39d4068a14b")

print("Patient:", patient)
print("Reports:", patient.diagnostic_reports)

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

dr = [_diagnostic_report_to_fhir(d) for d in patient.diagnostic_reports]
print("Serialized reports:", json.dumps(dr, indent=2))

bundle = PatientBundle(
    patient={"resourceType": "Patient", "id": "123"},
    diagnostic_reports=dr
)
print("Bundle JSON:", bundle.model_dump_json(indent=2, by_alias=True))
