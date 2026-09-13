import sys
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import Patient

db = next(get_db_session())
patient = db.get(Patient, "5538ae7e-de3a-4651-b52d-c39d4068a14b")
print("Patient:", patient)
print("Reports:", patient.diagnostic_reports)
