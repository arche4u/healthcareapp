import sys
import json
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import Encounter, DiagnosticReport

db = next(get_db_session())
enc = db.query(Encounter).first()
if enc:
    print(f"Testing with encounter {enc.id} for patient {enc.patient_id}")
    reports = db.query(DiagnosticReport).filter(DiagnosticReport.patient_id == enc.patient_id).all()
    print("Reports by patient_id:", len(reports), reports)
else:
    print("No encounters found.")
