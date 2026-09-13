import sys
import json
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import Patient
from shared.fhir.models import PatientBundle
from app import _patient_to_fhir, _encounter_to_fhir, _observation_to_fhir, _medication_to_fhir, _diagnostic_report_to_fhir, _consent_to_fhir

db = next(get_db_session())
patient = db.get(Patient, "5538ae7e-de3a-4651-b52d-c39d4068a14b")

bundle = PatientBundle(
    patient=_patient_to_fhir(patient),
    encounters=[_encounter_to_fhir(e) for e in patient.encounters],
    observations=[_observation_to_fhir(o) for o in patient.observations],
    medications=[_medication_to_fhir(m) for m in patient.medications],
    diagnostic_reports=[_diagnostic_report_to_fhir(d) for d in patient.diagnostic_reports],
    consents=[_consent_to_fhir(c) for c in patient.consents],
)
print(json.dumps(bundle.model_dump(by_alias=True), indent=2, default=str))
