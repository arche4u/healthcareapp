import os
import sys

# Add OneHealth to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from shared.sdk.database import get_db_session
from shared.sdk.models import User, UserRole, UserStatus, Practitioner

db = next(get_db_session())

doctors = db.query(User).filter(
    User.role == UserRole.DOCTOR,
    User.status == UserStatus.ACTIVE
).all()

print(f"Found {len(doctors)} active doctors.")
for d in doctors:
    practitioner = db.query(Practitioner).filter(Practitioner.user_id == d.id).first()
    print(d.email, d.role, d.hospital_id, practitioner.specialty if practitioner else "No practitioner")

db.close()
