import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.sdk.database import get_db_session
from shared.sdk.models import DiagnosticReport, Patient, Encounter
import json

db = next(get_db_session())
reports = db.query(DiagnosticReport).all()
print(f"Total reports in DB: {len(reports)}")
if len(reports) > 0:
    print(reports[0].patient_id)
