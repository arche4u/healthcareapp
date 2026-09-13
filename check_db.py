import os
import sys

# Add OneHealth to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from shared.sdk.database import get_db_session
from shared.sdk.models import User, UserRole

db = next(get_db_session())

doctors = db.query(User).all()
for d in doctors:
    print(d.email, d.role, d.hospital_id, getattr(d, 'is_active', None))

db.close()
