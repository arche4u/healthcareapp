"""
OneHealth Auth Service
JWT-based OAuth2 server with hospital- and role-scoped tokens.
"""
import os
import logging
from datetime import timedelta
from functools import wraps

from flask import Flask, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
import httpx

# Shared SDK imports
from shared.sdk.models import User, UserRole, UserStatus
from shared.sdk.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
)
from shared.sdk.database import get_db_session
from shared.sdk.cache import cache_get, cache_set, cache_delete

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    """Application factory."""
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-secret-change")

    @app.route("/auth/health")
    def health():
        return jsonify({"status": "ok", "service": "auth-svc"})

    @app.route("/auth/register", methods=["POST"])
    def register():
        """Register a new user (patient or link to existing record)."""
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "patient")
        full_name = data.get("full_name")
        phone = data.get("phone", "").strip()
        dob = data.get("dob")
        gender = data.get("gender")
        if not phone:
            phone = None
        hospital_id = data.get("hospital_id")
        abha_id = data.get("abha_id")

        if not email or not password or not full_name:
            return jsonify({"error": "email, password, and full_name are required"}), 400

        db = next(get_db_session())

        try:
            # Check if user already exists
            existing = db.query(User).filter(
                (User.email == email) | (User.phone == phone if phone else False)
            ).first()

            if existing:
                return jsonify({"error": "User already exists"}), 409

            user = User(
                email=email,
                phone=phone,
                password_hash=generate_password_hash(password),
                role=UserRole(role),
                status=UserStatus.PENDING_VERIFICATION if role == "patient" else UserStatus.ACTIVE,
                hospital_id=hospital_id if role in ("doctor", "nurse", "admin", "hospital_admin") else None,
                full_name=full_name,
                email_verified=False,
                phone_verified=bool(phone),
            )

            db.add(user)
            db.flush()

            # If patient, create a linked Patient FHIR record
            from shared.sdk.models import Patient
            if role == "patient":
                # Build FHIR HumanName from full_name
                name_parts = full_name.strip().split(" ", 1)
                fhir_name = [{"use": "official", "family": name_parts[1] if len(name_parts) > 1 else "", "given": [name_parts[0]]}]
                # Build FHIR telecom
                telecom = [{"system": "email", "value": email, "use": "home"}]
                if phone:
                    telecom.append({"system": "phone", "value": phone, "use": "mobile"})
                patient = Patient(
                    active=True,
                    user_id=user.id,
                    name=fhir_name,
                    telecom=telecom,
                    gender=gender or "unknown",
                    birth_date=dob or None,
                    abha_id=abha_id or None,
                )
                db.add(patient)
                db.flush()
                user.patient_id = patient.id
                user.status = UserStatus.ACTIVE
            # If ABHA provided for non-patient or existing record, link to it
            elif abha_id:
                patient = db.query(Patient).filter(Patient.abha_id == abha_id).first()
                if patient:
                    patient.user_id = user.id

            db.commit()

            logger.info(f"User registered: {email} (role: {role})")

            return jsonify({
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "status": user.status.value,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "patient_id": str(user.patient_id) if user.patient_id else None
                }
            }), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Registration failed: {e}")
            return jsonify({"error": "Registration failed"}), 500
        finally:
            db.close()

    @app.route("/auth/login-face", methods=["POST"])
    def login_face():
        """Authenticate user with email and face image."""
        data = request.get_json() or {}
        email = data.get("email")
        image = data.get("image")

        if not email or not image:
            return jsonify({"error": "email and image required"}), 400

        db = next(get_db_session())
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({"error": "Invalid credentials"}), 401

            if user.status == UserStatus.SUSPENDED:
                return jsonify({"error": "Account suspended"}), 403

            if not user.patient_id:
                return jsonify({"error": "User is not linked to a patient profile"}), 400

            # Verify face via identity-svc
            identity_svc_url = os.environ.get("IDENTITY_SVC_URL", "http://identity-svc:5001")
            try:
                resp = httpx.post(f"{identity_svc_url}/identity/verify-face", json={
                    "patient_id": str(user.patient_id),
                    "image": image
                }, timeout=10.0)
                if resp.status_code != 200:
                    return jsonify({"error": resp.json().get("error", "Face verification failed")}), resp.status_code
                
                match_data = resp.json()
                if not match_data.get("match"):
                    return jsonify({"error": "Face does not match registered profile"}), 401
            except httpx.RequestError as e:
                logger.error(f"Failed to call identity-svc: {e}")
                return jsonify({"error": "Internal identity service error"}), 500

            # Generate tokens
            scopes = _build_scopes(user)
            access_token = create_access_token(
                subject=str(user.id),
                hospital_id=str(user.hospital_id) if user.hospital_id else None,
                role=user.role.value,
                doctor_id=str(user.practitioner_id) if user.practitioner_id else None,
                patient_id=str(user.patient_id) if user.patient_id else None,
                scopes=scopes,
                expires_delta=timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            refresh_token = create_refresh_token(subject=str(user.id))
            cache_set(f"auth:tokens:{user.id}", {"access": access_token, "refresh": refresh_token}, ttl=86400)

            return jsonify({
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role.value,
                    "hospital_id": str(user.hospital_id) if user.hospital_id else None,
                    "patient_id": str(user.patient_id) if user.patient_id else None,
                    "practitioner_id": str(user.practitioner_id) if user.practitioner_id else None,
                    "full_name": user.full_name,
                }
            })

        except Exception as e:
            logger.error(f"Face login failed: {e}")
            return jsonify({"error": "Login failed"}), 500
        finally:
            db.close()

    @app.route("/auth/login", methods=["POST"])
    def login():
        """Authenticate user and return access + refresh tokens."""
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "email and password required"}), 400

        db = next(get_db_session())

        try:
            user = db.query(User).filter(User.email == email).first()

            if not user:
                return jsonify({"error": "Invalid credentials"}), 401

            if not check_password_hash(user.password_hash, password):
                return jsonify({"error": "Invalid credentials"}), 401

            if user.status == UserStatus.SUSPENDED:
                return jsonify({"error": "Account suspended"}), 403

            # Generate scopes based on role
            scopes = _build_scopes(user)

            access_token = create_access_token(
                subject=str(user.id),
                hospital_id=str(user.hospital_id) if user.hospital_id else None,
                role=user.role.value,
                doctor_id=str(user.practitioner_id) if user.practitioner_id else None,
                patient_id=str(user.patient_id) if user.patient_id else None,
                scopes=scopes,
                expires_delta=timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
            )

            refresh_token = create_refresh_token(subject=str(user.id))

            # Cache token info for quick lookup (revocation support)
            cache_set(f"auth:tokens:{user.id}", {"access": access_token, "refresh": refresh_token}, ttl=86400)

            logger.info(f"User logged in: {email}")

            return jsonify({
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "Bearer",
                "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "scope": " ".join(scopes),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value,
                    "hospital_id": str(user.hospital_id) if user.hospital_id else None,
                },
            })

        except Exception as e:
            logger.error(f"Login failed: {e}")
            return jsonify({"error": "Login failed"}), 500
        finally:
            db.close()

    @app.route("/auth/token", methods=["POST"])
    def token():
        """OAuth2 token endpoint (grant_type=refresh)."""
        grant_type = request.form.get("grant_type", "")
        refresh_token = request.form.get("refresh_token", "")

        if grant_type == "refresh_token":
            from shared.sdk.auth import decode_token
            token_data = decode_token(refresh_token)
            if not token_data or token_data.token_type != "refresh":
                return jsonify({"error": "Invalid refresh token"}), 401

            db = next(get_db_session())
            try:
                user = db.get(User, token_data.sub)
                if not user:
                    return jsonify({"error": "User not found"}), 404

                scopes = _build_scopes(user)
                access_token = create_access_token(
                    subject=str(user.id),
                    hospital_id=str(user.hospital_id) if user.hospital_id else None,
                    role=user.role.value,
                    doctor_id=str(user.practitioner_id) if user.practitioner_id else None,
                    patient_id=str(user.patient_id) if user.patient_id else None,
                    scopes=scopes,
                    expires_delta=timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
                )

                return jsonify({
                    "access_token": access_token,
                    "token_type": "Bearer",
                    "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                })

            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
                return jsonify({"error": "Token refresh failed"}), 500
            finally:
                db.close()

        elif grant_type == "password":
            # Standard OAuth password grant (for API clients)
            email = request.form.get("username")
            password = request.form.get("password")

            data = {"email": email, "password": password}
            request.get_json = lambda: data  # noqa: E731
            return login()

        return jsonify({"error": "Unsupported grant_type"}), 400

    @app.route("/auth/revoke", methods=["POST"])
    def revoke():
        """Revoke a token (invalidate immediately)."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        # Invalidate cached token
        cache_delete(f"auth:tokens:{token_data.sub}")
        cache_set(f"auth:blacklist:{token}", True, ttl=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60)

        return jsonify({"status": "revoked"})

    @app.route("/auth/userinfo", methods=["GET"])
    def userinfo():
        """Get current user info from token."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        db = next(get_db_session())
        try:
            user = db.get(User, token_data.sub)
            if not user:
                return jsonify({"error": "User not found"}), 404

            specialty = None
            if user.practitioner:
                specialty = user.practitioner.specialty

            patient_id = None
            if user.patient:
                patient_id = str(user.patient.id)

            return jsonify({
                "sub": str(user.id),
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "hospital_id": str(user.hospital_id) if user.hospital_id else None,
                "patient_id": patient_id,
                "specialty": specialty,
                "scopes": token_data.scopes,
                "iat": token_data.iat,
                "exp": token_data.exp,
            })
        finally:
            db.close()

    @app.route("/auth/hospitals/<hospital_id>", methods=["GET"])
    def get_hospital(hospital_id):
        """Get hospital details by ID."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        db = next(get_db_session())
        try:
            from shared.sdk.models import Hospital
            hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
            if not hospital:
                return jsonify({"error": "Hospital not found"}), 404

            return jsonify({
                "id": str(hospital.id),
                "identifier": hospital.identifier,
                "name": hospital.name,
                "hfr_id": hospital.hfr_id,
                "address": hospital.address,
                "telecom": hospital.telecom,
                "active": hospital.active,
            })
        finally:
            db.close()

    @app.route("/auth/doctors/hospital/<hospital_id>", methods=["GET"])
    def get_hospital_doctors(hospital_id):
        """Get all doctors registered at a hospital."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        db = next(get_db_session())
        try:
            from shared.sdk.models import Hospital
            hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
            if not hospital:
                return jsonify({"error": "Hospital not found"}), 404

            doctors = db.query(User).filter(
                User.hospital_id == hospital.id,
                User.role.in_([UserRole.DOCTOR, UserRole.NURSE])
            ).all()

            return jsonify({
                "hospital": hospital.name,
                "doctors": [{
                    "id": str(d.id),
                    "email": d.email,
                    "full_name": d.full_name,
                    "role": d.role.value,
                    "practitioner_id": str(d.practitioner_id) if d.practitioner_id else None,
                } for d in doctors]
            })
        finally:
            db.close()

    @app.route("/auth/users/me", methods=["PATCH"])
    def update_profile():
        """Update current user's profile (name, email, password)."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        data = request.get_json() or {}

        db = next(get_db_session())
        try:
            user = db.get(User, token_data.sub)
            if not user:
                return jsonify({"error": "User not found"}), 404

            if "full_name" in data and data["full_name"]:
                user.full_name = data["full_name"]

            if "email" in data and data["email"]:
                # Check uniqueness
                existing = db.query(User).filter(User.email == data["email"], User.id != user.id).first()
                if existing:
                    return jsonify({"error": "Email already in use"}), 409
                user.email = data["email"]

            if "password" in data and data["password"]:
                if len(data["password"]) < 8:
                    return jsonify({"error": "Password must be at least 8 characters"}), 400
                user.password_hash = generate_password_hash(data["password"])

            db.commit()

            return jsonify({
                "sub": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
            })
        except Exception as e:
            db.rollback()
            logger.error(f"Update profile failed: {e}")
            return jsonify({"error": "Failed to update profile"}), 500
        finally:
            db.close()

    @app.route("/auth/hospitals", methods=["GET"])
    def list_hospitals():
        """List all active hospitals (for appointment booking)."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        db = next(get_db_session())
        try:
            from shared.sdk.models import Hospital
            hospitals = db.query(Hospital).filter(Hospital.active == True).all()
            return jsonify({
                "hospitals": [{
                    "id": str(h.id),
                    "name": h.name,
                    "identifier": h.identifier,
                    "address": h.address,
                    "telecom": h.telecom,
                } for h in hospitals]
            })
        except Exception as e:
            logger.error(f"List hospitals failed: {e}")
            return jsonify({"error": "Failed to list hospitals"}), 500
        finally:
            db.close()

    @app.route("/auth/register-hospital", methods=["POST"])
    def register_hospital():
        """Register a new hospital and create a hospital_admin user atomically."""
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")
        full_name = data.get("full_name")
        hospital_name = data.get("hospital_name")
        hospital_city = data.get("hospital_city", "")
        hospital_state = data.get("hospital_state", "")
        phone = data.get("phone")

        if not email or not password or not full_name or not hospital_name:
            return jsonify({"error": "email, password, full_name, and hospital_name are required"}), 400

        db = next(get_db_session())
        try:
            # Check duplicate email
            if db.query(User).filter(User.email == email).first():
                return jsonify({"error": "Email already registered"}), 409

            from shared.sdk.models import Hospital
            import uuid

            # Create hospital
            hospital = Hospital(
                identifier=f"HOSP-{str(uuid.uuid4())[:8].upper()}",
                name=hospital_name,
                type=[{"text": "Hospital"}],
                alias=[],
                telecom=[{"system": "phone", "value": phone or "", "use": "work"}] if phone else [],
                address=[{
                    "use": "work",
                    "line": [],
                    "city": hospital_city,
                    "state": hospital_state,
                    "country": "IN"
                }],
                active=True,
            )
            db.add(hospital)
            db.flush()

            # Create hospital admin user
            admin = User(
                email=email,
                phone=phone,
                password_hash=generate_password_hash(password),
                role=UserRole.HOSPITAL_ADMIN,
                status=UserStatus.ACTIVE,
                hospital_id=hospital.id,
                full_name=full_name,
                email_verified=True,
            )
            db.add(admin)
            db.commit()

            logger.info(f"Hospital registered: {hospital_name} | Admin: {email}")
            return jsonify({
                "id": str(admin.id),
                "email": admin.email,
                "full_name": admin.full_name,
                "role": admin.role.value,
                "hospital_id": str(hospital.id),
                "hospital_name": hospital.name,
            }), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Hospital registration failed: {e}")
            return jsonify({"error": "Registration failed"}), 500
        finally:
            db.close()

    @app.route("/auth/staff", methods=["POST"])
    def register_staff():
        """Hospital admin registers a doctor or nurse for their hospital."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        # Only hospital admins can add staff
        if token_data.role not in ("hospital_admin", "admin"):
            return jsonify({"error": "Forbidden: only hospital admins can add staff"}), 403

        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")
        full_name = data.get("full_name")
        role = data.get("role", "doctor")  # doctor or nurse
        specialty = data.get("specialty", "")
        phone = data.get("phone", "").strip()
        if not phone:
            phone = None
        if not email or not password or not full_name:
            return jsonify({"error": "email, password, and full_name are required"}), 400

        if role not in ("doctor", "nurse"):
            return jsonify({"error": "role must be 'doctor' or 'nurse'"}), 400

        db = next(get_db_session())
        try:
            if db.query(User).filter(User.email == email).first():
                return jsonify({"error": "Email already registered"}), 409

            hospital_id = token_data.hospital_id

            # Create user
            staff_user = User(
                email=email,
                phone=phone,
                password_hash=generate_password_hash(password),
                role=UserRole(role),
                status=UserStatus.ACTIVE,
                hospital_id=hospital_id,
                full_name=full_name,
                email_verified=True,
            )
            db.add(staff_user)
            db.flush()

            # Create Practitioner record
            from shared.sdk.models import Practitioner
            name_parts = full_name.strip().split(" ")
            family = name_parts[-1] if len(name_parts) > 1 else full_name
            given = name_parts[:-1] if len(name_parts) > 1 else [full_name]

            practitioner = Practitioner(
                active=True,
                name=[{"use": "official", "family": family, "given": given}],
                identifiers=[],
                telecom=[{"system": "phone", "value": phone, "use": "work"}] if phone else [],
                address=[],
                photo=[],
                qualification=[],
                communication=[],
                hospital_id=hospital_id,
                specialty=specialty,
                user_id=staff_user.id,
            )
            db.add(practitioner)
            db.flush()

            # Link back
            staff_user.practitioner_id = practitioner.id
            db.commit()

            logger.info(f"Staff registered: {email} as {role} for hospital {hospital_id}")
            return jsonify({
                "id": str(staff_user.id),
                "email": staff_user.email,
                "full_name": staff_user.full_name,
                "role": staff_user.role.value,
                "specialty": specialty,
                "practitioner_id": str(practitioner.id),
                "hospital_id": str(hospital_id),
            }), 201

        except Exception as e:
            db.rollback()
            logger.error(f"Staff registration failed: {e}")
            return jsonify({"error": "Staff registration failed"}), 500
        finally:
            db.close()

    @app.route("/auth/staff", methods=["GET"])
    def get_staff():
        """Hospital admin lists all doctors and nurses at their hospital."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header[7:]
        token_data = decode_token(token)
        if not token_data:
            return jsonify({"error": "Invalid token"}), 401

        if token_data.role not in ("hospital_admin", "admin"):
            return jsonify({"error": "Forbidden"}), 403

        db = next(get_db_session())
        try:
            from shared.sdk.models import Practitioner, Hospital
            hospital_id = token_data.hospital_id

            hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()

            staff_users = db.query(User).filter(
                User.hospital_id == hospital_id,
                User.role.in_([UserRole.DOCTOR, UserRole.NURSE])
            ).all()

            staff_list = []
            for u in staff_users:
                prac = db.query(Practitioner).filter(Practitioner.user_id == u.id).first()
                staff_list.append({
                    "id": str(u.id),
                    "email": u.email,
                    "full_name": u.full_name,
                    "role": u.role.value,
                    "status": u.status.value,
                    "specialty": prac.specialty if prac else "",
                    "practitioner_id": str(prac.id) if prac else None,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                })

            return jsonify({
                "hospital": {
                    "id": str(hospital.id) if hospital else hospital_id,
                    "name": hospital.name if hospital else "Unknown",
                },
                "staff": staff_list,
                "count": len(staff_list),
            })

        except Exception as e:
            logger.error(f"Get staff failed: {e}")
            return jsonify({"error": "Failed to get staff"}), 500
        finally:
            db.close()

    return app



def _build_scopes(user: User) -> list[str]:
    """Build JWT scopes based on user role."""
    base_scopes = ["openid", "profile"]
    role_scopes = {
        UserRole.PATIENT: ["patient:read", "patient:write", "appointment:read", "reminder:read"],
        UserRole.DOCTOR: ["doctor:read", "doctor:write", "patient:read", "patient:write",
                          "encounter:read", "encounter:write", "observation:read", "observation:write",
                          "medication:read", "medication:write", "consent:read", "consent:write"],
        UserRole.NURSE: ["patient:read", "patient:write", "encounter:read", "encounter:write",
                         "observation:read", "observation:write"],
        UserRole.ADMIN: ["admin:all"],
        UserRole.HOSPITAL_ADMIN: ["hospital:admin", "doctor:read", "doctor:write",
                                   "patient:read", "patient:write", "consent:read", "consent:write"],
    }
    return base_scopes + role_scopes.get(user.role, [])


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)