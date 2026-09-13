import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.sdk.database import get_db_session
from shared.sdk.models import Observation
import json

db = next(get_db_session())
obs = db.query(Observation).first()

if obs:
    print(json.dumps(obs.code, indent=2))
    print(json.dumps(obs.valueQuantity, indent=2))
    print(json.dumps(obs.component, indent=2))
else:
    print("No observations found.")
