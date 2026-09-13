"""
OneHealth Database Initialization Script
Creates all tables and seeds initial data (hospitals, roles, test data).
"""
import os
import sys
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

# Add shared to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from werkzeug.security import generate_password_hash

# Import our models
from shared.sdk.models import (
    Base, Hospital, User, Patient, Practitioner, Encounter,
    UserRole, UserStatus, EncounterStatus, ObservationStatus,
    MedicationStatus, ConsentStatus
)
from shared.fhir.models import (
    HumanName, ContactPoint, Address, Identifier, CodeableConcept, Coding
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://onehealth:onehealth@localhost:5432/onehealth"
    )


def init_database():
    """Create all tables."""
    db_url = get_database_url()
    engine = create_engine(db_url)

    logger.info("Creating all tables...")
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Check if already initialized
        existing_hospitals = db.query(Hospital).count()
        if existing_hospitals > 0:
            logger.info("Database already initialized, skipping seed data.")
            return

        logger.info("Seeding initial data...")

        # ── Create hospitals ─────────────────────────────────────────────────────
        hospital1 = Hospital(
            identifier="HOSP-001",
            name="OneHealth Medical Center",
            type=[{"text": "Hospital"}],
            alias=["OneHealth MC", "OHC"],
            telecom=[
                {"system": "phone", "value": "+91-11-1234-5678", "use": "work"},
                {"system": "email", "value": "admin@onehealth.example.com", "use": "work"}
            ],
            address=[{
                "use": "work",
                "line": ["123 Health Plaza, Sector 18"],
                "city": "Gurugram",
                "state": "Haryana",
                "postalCode": "122001",
                "country": "IN"
            }],
            hfr_id="HFR-AB-12345",
            active=True,
        )

        hospital2 = Hospital(
            identifier="HOSP-002",
            name="AIIMS Delhi",
            type=[{"text": "Hospital"}],
            alias=["AIIMS", "All India Institute of Medical Sciences"],
            telecom=[{"system": "phone", "value": "+91-11-2658-8500", "use": "work"}],
            address=[{
                "use": "work",
                "line": ["Ansari Nagar East"],
                "city": "New Delhi",
                "state": "Delhi",
                "postalCode": "110029",
                "country": "IN"
            }],
            hfr_id="HFR-DL-00001",
            active=True,
        )

        hospital3 = Hospital(
            identifier="HOSP-003",
            name="Apollo Hospitals Hyderabad",
            type=[{"text": "Hospital"}],
            alias=["Apollo Hyderabad"],
            telecom=[{"system": "phone", "value": "+91-40-2360-7777", "use": "work"}],
            address=[{
                "use": "work",
                "line": ["Jubilee Hills"],
                "city": "Hyderabad",
                "state": "Telangana",
                "postalCode": "500033",
                "country": "IN"
            }],
            hfr_id="HFR-TS-00001",
            active=True,
        )

        db.add_all([hospital1, hospital2, hospital3])
        db.flush()

        # ── Create users ─────────────────────────────────────────────────────────
        admin_user = User(
            email="admin@onehealth.example.com",
            phone="+91-99999-00001",
            password_hash=generate_password_hash("Admin@123"),
            role=UserRole.HOSPITAL_ADMIN,
            status=UserStatus.ACTIVE,
            hospital_id=hospital1.id,
            full_name="Admin User",
            email_verified=True,
            phone_verified=True,
        )

        doctor1 = User(
            email="dr.priya@onehealth.example.com",
            phone="+91-99999-00002",
            password_hash=generate_password_hash("Doctor@123"),
            role=UserRole.DOCTOR,
            status=UserStatus.ACTIVE,
            hospital_id=hospital1.id,
            full_name="Dr. Priya Sharma",
            email_verified=True,
        )

        doctor2 = User(
            email="dr.arjun@onehealth.example.com",
            phone="+91-99999-00003",
            password_hash=generate_password_hash("Doctor@123"),
            role=UserRole.DOCTOR,
            status=UserStatus.ACTIVE,
            hospital_id=hospital2.id,
            full_name="Dr. Arjun Reddy",
            email_verified=True,
        )

        doctor3 = User(
            email="dr.meena@onehealth.example.com",
            phone="+91-99999-00004",
            password_hash=generate_password_hash("Doctor@123"),
            role=UserRole.DOCTOR,
            status=UserStatus.ACTIVE,
            hospital_id=hospital3.id,
            full_name="Dr. Meena Nair",
            email_verified=True,
        )

        nurse1 = User(
            email="nurse.kavya@onehealth.example.com",
            phone="+91-99999-00005",
            password_hash=generate_password_hash("Nurse@123"),
            role=UserRole.NURSE,
            status=UserStatus.ACTIVE,
            hospital_id=hospital1.id,
            full_name="Kavya R.",
            email_verified=True,
        )

        db.add_all([admin_user, doctor1, doctor2, doctor3, nurse1])
        db.flush()

        # ── Create Practitioner records ───────────────────────────────────────────
        prac1 = Practitioner(
            active=True,
            name=[{"use": "official", "family": "Sharma", "given": ["Priya"]}],
            identifiers=[], telecom=[], address=[], photo=[], qualification=[], communication=[],
            hospital_id=hospital1.id,
            specialty="General Medicine",
            user_id=doctor1.id,
        )
        prac2 = Practitioner(
            active=True,
            name=[{"use": "official", "family": "Reddy", "given": ["Arjun"]}],
            identifiers=[], telecom=[], address=[], photo=[], qualification=[], communication=[],
            hospital_id=hospital2.id,
            specialty="Cardiology",
            user_id=doctor2.id,
        )
        prac3 = Practitioner(
            active=True,
            name=[{"use": "official", "family": "Nair", "given": ["Meena"]}],
            identifiers=[], telecom=[], address=[], photo=[], qualification=[], communication=[],
            hospital_id=hospital3.id,
            specialty="Orthopedics",
            user_id=doctor3.id,
        )

        db.add_all([prac1, prac2, prac3])
        db.flush()

        # Link practitioner IDs back to users
        doctor1.practitioner_id = prac1.id
        doctor2.practitioner_id = prac2.id
        doctor3.practitioner_id = prac3.id

        db.commit()
        logger.info("✓ Database initialized successfully!")

        logger.info("\n" + "=" * 60)
        logger.info("OneHealth - Initialization Complete")
        logger.info("=" * 60)
        logger.info(f"  Hospitals: {db.query(Hospital).count()}")
        logger.info(f"  Users: {db.query(User).count()}")
        logger.info(f"  Practitioners: {db.query(Practitioner).count()}")
        logger.info("  Demo credentials:")
        logger.info("    Admin:  admin@onehealth.example.com / Admin@123")
        logger.info("    Doctor: dr.priya@onehealth.example.com / Doctor@123  (OneHealth Medical Center)")
        logger.info("    Doctor: dr.arjun@onehealth.example.com / Doctor@123  (AIIMS Delhi)")
        logger.info("    Doctor: dr.meena@onehealth.example.com / Doctor@123  (Apollo Hyderabad)")
        logger.info("    Nurse:  nurse.kavya@onehealth.example.com / Nurse@123")
        logger.info("=" * 60)

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed database: {e}")
        raise
    finally:
        db.close()



def check_connection() -> bool:
    """Check database connectivity."""
    try:
        db_url = get_database_url()
        engine = create_engine(db_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        return False


if __name__ == "__main__":
    if not check_connection():
        sys.exit(1)
    init_database()