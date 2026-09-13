import sys
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import User
import jwt
from datetime import datetime, timedelta, timezone

db = next(get_db_session())
user = db.query(User).first()

payload = {
    "sub": str(user.id),
    "role": user.role.value,
    "hospital_id": str(user.hospital_id) if user.hospital_id else None,
    "permissions": ["patient:read", "patient:write", "encounter:read", "encounter:write"],
    "exp": datetime.now(timezone.utc) + timedelta(days=1)
}

token = jwt.encode(payload, "super-secret-key-change-in-prod", algorithm="HS256")
print(f"export TOKEN={token}")
