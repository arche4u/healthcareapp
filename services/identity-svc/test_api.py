import sys
import urllib.request
import urllib.error
sys.path.append('.')
from shared.sdk.database import get_db_session
from shared.sdk.models import User
import jwt
from datetime import datetime, timedelta, timezone
import json

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
req = urllib.request.Request(
    "http://localhost:5001/identity/patients/5538ae7e-de3a-4651-b52d-c39d4068a14b/bundle",
    headers={"Authorization": f"Bearer {token}"}
)
try:
    with urllib.request.urlopen(req) as response:
        print(json.dumps(json.loads(response.read()), indent=2))
except urllib.error.URLError as e:
    print(f"Error: {e}")
