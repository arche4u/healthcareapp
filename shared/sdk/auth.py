"""JWT Authentication utilities."""
import os
import time
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from jwt import PyJWTError
from flask import request, g, jsonify
from functools import wraps

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
JWT_ISSUER = os.getenv("JWT_ISSUER", "onehealth-auth")


@dataclass
class TokenData:
    """Decoded JWT token data."""
    sub: str  # user id
    hospital_id: Optional[str] = None
    role: Optional[str] = None
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None
    scopes: list[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    token_type: str = "access"

    def __post_init__(self):
        if self.scopes is None:
            self.scopes = []

    def has_scope(self, scope: str) -> bool:
        return scope in self.scopes

    def has_role(self, role: str) -> bool:
        return self.role == role

    def is_doctor(self) -> bool:
        return self.role == "doctor"

    def is_admin(self) -> bool:
        return self.role in ("admin", "hospital_admin")


def create_access_token(
    subject: str,
    hospital_id: Optional[str] = None,
    role: Optional[str] = None,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    scopes: list[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    if scopes is None:
        scopes = []

    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "hospital_id": hospital_id,
        "role": role,
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "scopes": scopes,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": JWT_ISSUER,
        "token_type": "access",
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Create a JWT refresh token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": JWT_ISSUER,
        "token_type": "refresh",
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={"verify_exp": True},
        )
        return TokenData(
            sub=payload.get("sub"),
            hospital_id=payload.get("hospital_id"),
            role=payload.get("role"),
            doctor_id=payload.get("doctor_id"),
            patient_id=payload.get("patient_id"),
            scopes=payload.get("scopes", []),
            exp=payload.get("exp"),
            iat=payload.get("iat"),
            token_type=payload.get("token_type", "access"),
        )
    except PyJWTError as e:
        logger.warning(f"Token decode failed: {e}")
        return None


def require_token(required_scopes: list[str] = None) -> TokenData:
    """
    Flask decorator / middleware to require a valid JWT token.
    Can be used as: @require_token() or @require_token(["patient:read"])
    """
    if required_scopes is None:
        required_scopes = []

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or invalid Authorization header"}), 401

            token = auth_header[7:]  # Remove "Bearer "
            token_data = decode_token(token)

            if not token_data:
                return jsonify({"error": "Invalid or expired token"}), 401

            if token_data.token_type != "access":
                return jsonify({"error": "Invalid token type"}), 401

            # Check required scopes
            for scope in required_scopes:
                if not token_data.has_scope(scope):
                    return jsonify({"error": f"Insufficient scope: {scope}"}), 403

            # Attach to Flask g for use in route
            g.current_user = token_data
            return f(*args, **kwargs)
        return decorated_function
    return decorator


class AuthMiddleware:
    """Flask middleware to automatically parse and attach token to g.current_user."""

    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)

    def init_app(self, app):
        app.before_request(self._process_token)

    def _process_token(self):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            token_data = decode_token(token)
            if token_data and token_data.token_type == "access":
                g.current_user = token_data


def get_current_user() -> Optional[TokenData]:
    """Get current user from Flask g."""
    from flask import g
    return getattr(g, "current_user", None)


def require_hospital_scope(hospital_id: str) -> bool:
    """Check if current user has access to the given hospital."""
    user = get_current_user()
    if not user:
        return False
    # Admins can access all hospitals
    if user.is_admin():
        return True
    # Others must match hospital_id
    return user.hospital_id == hospital_id


# Convenience decorators for common role checks
def require_doctor(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_doctor():
            return jsonify({"error": "Doctor access required"}), 403
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_admin():
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def require_patient(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or user.role != "patient":
            return jsonify({"error": "Patient access required"}), 403
        return f(*args, **kwargs)
    return decorated