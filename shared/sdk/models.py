"""SQLAlchemy models for OneHealth - maps FHIR resources to PostgreSQL tables."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, Integer, ForeignKey,
    Index, UniqueConstraint, JSON, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
import enum
from pydantic import BaseModel

Base = declarative_base()


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    NURSE = "nurse"
    ADMIN = "admin"
    HOSPITAL_ADMIN = "hospital_admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class ConsentStatus(str, enum.Enum):
    DRAFT = "draft"
    PROPOSED = "proposed"
    ACTIVE = "active"
    REJECTED = "rejected"
    INACTIVE = "inactive"
    ENTERED_IN_ERROR = "entered-in-error"


class EncounterStatus(str, enum.Enum):
    PLANNED = "planned"
    ARRIVED = "arrived"
    TRIAGED = "triaged"
    IN_PROGRESS = "in-progress"
    ONLEAVE = "onleave"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    ENTERED_IN_ERROR = "entered-in-error"
    UNKNOWN = "unknown"


class ObservationStatus(str, enum.Enum):
    REGISTERED = "registered"
    PRELIMINARY = "preliminary"
    FINAL = "final"
    AMENDED = "amended"
    CORRECTED = "corrected"
    CANCELLED = "cancelled"
    ENTERED_IN_ERROR = "entered-in-error"
    UNKNOWN = "unknown"


class MedicationStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_HOLD = "on-hold"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    ENTERED_IN_ERROR = "entered-in-error"
    STOPPED = "stopped"
    DRAFT = "draft"
    UNKNOWN = "unknown"


def gen_uuid():
    return uuid.uuid4()


# ──────────────────────────────────────────────────────────────────────────────
# Core Tables
# ──────────────────────────────────────────────────────────────────────────────

class Hospital(Base):
    """Hospital/Organization table."""
    __tablename__ = "hospitals"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)
    identifier = Column(String(100), unique=True, nullable=False, index=True)  # HFR ID
    name = Column(String(255), nullable=False)
    type = Column(JSONB, default=list)  # CodeableConcept list
    alias = Column(JSONB, default=list)
    telecom = Column(JSONB, default=list)  # ContactPoint list
    address = Column(JSONB, default=list)  # Address list
    hfr_id = Column(String(100), unique=True, index=True)
    adapter_config = Column(JSONB, default=dict)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="hospital")
    practitioners = relationship("Practitioner", back_populates="hospital")
    patients = relationship("Patient", back_populates="managing_organization")
    encounters = relationship("Encounter", back_populates="hospital")

    def __repr__(self):
        return f"<Hospital {self.name} ({self.identifier})>"


class User(Base):
    """User accounts for authentication (patients, doctors, admins)."""
    __tablename__ = "users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, index=True)

    # Hospital scoping (for doctors/nurses/admins)
    hospital_id = Column(PGUUID(as_uuid=True), ForeignKey("hospitals.id"), index=True, nullable=True)

    # Linked FHIR resources
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), nullable=True, unique=True)
    practitioner_id = Column(PGUUID(as_uuid=True), ForeignKey("practitioners.id"), nullable=True, unique=True)

    # Profile
    full_name = Column(String(255))
    avatar_url = Column(String(500))
    preferred_language = Column(String(10), default="en")

    # Security
    failed_login_attempts = Column(Integer, default=0)
    last_login = Column(DateTime)
    locked_until = Column(DateTime)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="users")
    patient = relationship("Patient", back_populates="user", foreign_keys="Patient.user_id", uselist=False)
    practitioner = relationship("Practitioner", back_populates="user", foreign_keys="Practitioner.user_id", uselist=False)

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"


class Patient(Base):
    """Patient demographic and clinical summary (FHIR Patient)."""
    __tablename__ = "patients"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    # FHIR identifiers (ABHA, MRN, etc.)
    identifiers = Column(JSONB, default=list)  # list of Identifier dicts

    # Core demographics
    active = Column(Boolean, default=True)
    name = Column(JSONB, default=list)  # HumanName list
    telecom = Column(JSONB, default=list)  # ContactPoint list
    gender = Column(String(20))  # male, female, other, unknown
    birth_date = Column(String(20))  # YYYY-MM-DD
    address = Column(JSONB, default=list)  # Address list
    marital_status = Column(JSONB)  # CodeableConcept
    photo = Column(JSONB, default=list)  # Attachment list

    # OneHealth extensions
    biometric_template_hash = Column(String(255), unique=True, index=True, nullable=True)
    face_encoding = Column(JSONB, nullable=True) # 128-dimensional float array
    abha_id = Column(String(50), unique=True, index=True, nullable=True)
    consent_policy = Column(JSONB, default=dict)

    # Link to user account
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=True)

    # Managing organization (hospital)
    managing_organization_id = Column(PGUUID(as_uuid=True), ForeignKey("hospitals.id"), index=True, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient", foreign_keys=[user_id])
    managing_organization = relationship("Hospital", back_populates="patients")
    encounters = relationship("Encounter", back_populates="patient")
    observations = relationship("Observation", back_populates="patient")
    medications = relationship("MedicationRequest", back_populates="patient")
    diagnostic_reports = relationship("DiagnosticReport", back_populates="patient")
    consents = relationship("Consent", back_populates="patient")
    access_logs = relationship("AccessLog", back_populates="patient")

    def __repr__(self):
        name_str = ""
        if self.name and len(self.name) > 0:
            n = self.name[0]
            name_str = f"{n.get('given', [''])[0]} {n.get('family', '')}".strip()
        return f"<Patient {self.abha_id or self.id} ({name_str})>"


class Practitioner(Base):
    """Doctor/Nurse/Provider (FHIR Practitioner)."""
    __tablename__ = "practitioners"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    # FHIR identifiers (HPR, NPI, etc.)
    identifiers = Column(JSONB, default=list)

    # Core demographics
    active = Column(Boolean, default=True)
    name = Column(JSONB, default=list)  # HumanName list
    telecom = Column(JSONB, default=list)  # ContactPoint list
    address = Column(JSONB, default=list)  # Address list
    gender = Column(String(20))
    birth_date = Column(String(20))
    photo = Column(JSONB, default=list)  # Attachment list
    qualification = Column(JSONB, default=list)  # PractitionerQualification list
    communication = Column(JSONB, default=list)  # CodeableConcept list

    # OneHealth extensions
    hospital_id = Column(PGUUID(as_uuid=True), ForeignKey("hospitals.id"), index=True, nullable=True)
    hpr_id = Column(String(50), unique=True, index=True, nullable=True)
    specialty = Column(String(100), nullable=True)

    # Link to user account
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="practitioner", foreign_keys=[user_id])
    hospital = relationship("Hospital", back_populates="practitioners")
    encounters = relationship("Encounter", back_populates="practitioner")

    def __repr__(self):
        name_str = ""
        if self.name and len(self.name) > 0:
            n = self.name[0]
            name_str = f"{n.get('given', [''])[0]} {n.get('family', '')}".strip()
        return f"<Practitioner {name_str} ({self.specialty})>"


class Encounter(Base):
    """Patient visit/encounter (FHIR Encounter)."""
    __tablename__ = "encounters"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    # FHIR identifiers
    identifiers = Column(JSONB, default=list)

    # Status
    status = Column(SQLEnum(EncounterStatus), default=EncounterStatus.PLANNED, index=True)
    class_code = Column(JSONB, default=dict)  # CodeableConcept
    class_history = Column(JSONB, default=list)
    type = Column(JSONB, default=list)  # CodeableConcept list
    service_type = Column(JSONB)  # CodeableConcept
    priority = Column(JSONB)  # CodeableConcept

    # Subject (patient)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)

    # Participant (doctor)
    practitioner_id = Column(PGUUID(as_uuid=True), ForeignKey("practitioners.id"), index=True, nullable=True)

    # Hospital
    hospital_id = Column(PGUUID(as_uuid=True), ForeignKey("hospitals.id"), index=True, nullable=False)

    # Period
    period_start = Column(DateTime, index=True)
    period_end = Column(DateTime)

    # Reason
    reason_code = Column(JSONB, default=list)  # CodeableConcept list
    reason_reference = Column(JSONB, default=list)  # Reference list

    # Diagnosis (list of EncounterDiagnosis)
    diagnosis = Column(JSONB, default=list)

    # Clinical notes
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    practitioner = relationship("Practitioner", back_populates="encounters")
    hospital = relationship("Hospital", back_populates="encounters")
    observations = relationship("Observation", back_populates="encounter")
    medications = relationship("MedicationRequest", back_populates="encounter")

    def __repr__(self):
        return f"<Encounter {self.id} patient={self.patient_id} status={self.status.value}>"


class Observation(Base):
    """Vitals, lab results, clinical observations (FHIR Observation)."""
    __tablename__ = "observations"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    # FHIR identifiers
    identifiers = Column(JSONB, default=list)

    # Status
    status = Column(SQLEnum(ObservationStatus), default=ObservationStatus.FINAL, index=True)

    # Category (vital-signs, laboratory, etc.)
    category = Column(JSONB, default=list)  # CodeableConcept list

    # Code (what was measured)
    code = Column(JSONB, nullable=False)  # CodeableConcept

    # Subject
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)
    encounter_id = Column(PGUUID(as_uuid=True), ForeignKey("encounters.id"), index=True, nullable=True)

    # Performer (who recorded it)
    performer_id = Column(PGUUID(as_uuid=True), ForeignKey("practitioners.id"), index=True, nullable=True)

    # Effective time
    effective_datetime = Column(DateTime, index=True)

    # Value (one of these)
    value_quantity = Column(JSONB)  # Quantity
    value_codeable_concept = Column(JSONB)  # CodeableConcept
    value_string = Column(Text)
    value_boolean = Column(Boolean)
    value_integer = Column(Integer)
    value_range = Column(JSONB)  # Range
    value_ratio = Column(JSONB)  # Ratio

    # Interpretation, notes, reference range
    interpretation = Column(JSONB, default=list)
    note = Column(Text)
    reference_range = Column(JSONB, default=list)

    # Components (for multi-value observations like BP)
    components = Column(JSONB, default=list)  # ObservationComponent list

    # Timestamps
    issued = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="observations")
    encounter = relationship("Encounter", back_populates="observations")
    performer = relationship("Practitioner")

    def __repr__(self):
        code_display = self.code.get("text", "") if self.code else ""
        return f"<Observation {code_display} patient={self.patient_id}>"


class MedicationRequest(Base):
    """Prescription / medication order (FHIR MedicationRequest)."""
    __tablename__ = "medication_requests"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    # FHIR identifiers
    identifiers = Column(JSONB, default=list)

    # Status
    status = Column(SQLEnum(MedicationStatus), default=MedicationStatus.ACTIVE, index=True)
    intent = Column(String(50), default="order")  # proposal, plan, order, etc.
    category = Column(JSONB, default=list)
    priority = Column(String(20), default="routine")

    # Medication
    medication_codeable_concept = Column(JSONB)  # CodeableConcept
    medication_reference = Column(String(100))  # Reference to Medication resource

    # Subject
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)
    encounter_id = Column(PGUUID(as_uuid=True), ForeignKey("encounters.id"), index=True, nullable=True)

    # Prescriber
    requester_id = Column(PGUUID(as_uuid=True), ForeignKey("practitioners.id"), index=True, nullable=True)

    # Authored date
    authored_on = Column(DateTime, default=datetime.utcnow, index=True)

    # Dosage instructions (includes reminder schedule)
    dosage_instruction = Column(JSONB, default=list)

    # Dispense request
    dispense_request = Column(JSONB)

    # Substitution
    substitution = Column(JSONB)

    # Notes
    note = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="medications")
    encounter = relationship("Encounter", back_populates="medications")
    requester = relationship("Practitioner")

    def __repr__(self):
        med_name = ""
        if self.medication_codeable_concept:
            med_name = self.medication_codeable_concept.get("text", "")
        return f"<MedicationRequest {med_name} patient={self.patient_id} status={self.status.value}>"


class DiagnosticReport(Base):
    """Lab/diagnostic reports (FHIR DiagnosticReport)."""
    __tablename__ = "diagnostic_reports"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    identifiers = Column(JSONB, default=list)
    status = Column(String(50), default="final")
    category = Column(JSONB, default=list)
    code = Column(JSONB, nullable=False)

    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)
    encounter_id = Column(PGUUID(as_uuid=True), ForeignKey("encounters.id"), index=True, nullable=True)

    performer_id = Column(PGUUID(as_uuid=True), ForeignKey("practitioners.id"), index=True, nullable=True)

    effective_datetime = Column(DateTime)
    issued = Column(DateTime)

    # Results (references to Observations)
    result = Column(JSONB, default=list)

    # Media/attachments
    media = Column(JSONB, default=list)
    presented_form = Column(JSONB, default=list)  # Attachment list

    conclusion = Column(Text)
    conclusion_code = Column(JSONB, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="diagnostic_reports")
    encounter = relationship("Encounter")
    performer = relationship("Practitioner")

    def __repr__(self):
        code_display = self.code.get("text", "") if self.code else ""
        return f"<DiagnosticReport {code_display} patient={self.patient_id}>"


class Consent(Base):
    """Patient consent for data sharing (FHIR Consent - ABDM style)."""
    __tablename__ = "consents"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    identifiers = Column(JSONB, default=list)
    status = Column(SQLEnum(ConsentStatus), default=ConsentStatus.DRAFT, index=True)
    scope = Column(JSONB, nullable=False)  # CodeableConcept
    category = Column(JSONB, default=list)

    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)

    # Grantee (hospital/doctor who gets access)
    grantee_type = Column(String(50))  # hospital, practitioner, organization
    grantee_id = Column(PGUUID(as_uuid=True), index=True)  # hospital_id or practitioner_id

    # Time bounds
    period_start = Column(DateTime)
    period_end = Column(DateTime)

    # Provision rules
    provision = Column(JSONB)  # ConsentProvision

    # Policy
    policy = Column(JSONB, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="consents")

    def __repr__(self):
        return f"<Consent {self.id} patient={self.patient_id} status={self.status.value}>"


class AccessLog(Base):
    """Audit log for every data access (immutable)."""
    __tablename__ = "access_logs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    # Who accessed
    actor_type = Column(String(50))  # practitioner, patient, system
    actor_id = Column(PGUUID(as_uuid=True), index=True)
    actor_name = Column(String(255))

    # What was accessed
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)
    resource_type = Column(String(50))  # Patient, Encounter, Observation, etc.
    resource_id = Column(PGUUID(as_uuid=True))

    # Action
    action = Column(String(50))  # read, write, search, consent_granted, consent_revoked
    purpose = Column(String(100))  # treatment, billing, research, etc.

    # Context
    hospital_id = Column(PGUUID(as_uuid=True), ForeignKey("hospitals.id"), index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)

    # Result
    success = Column(Boolean, default=True)
    error_message = Column(Text)

    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    patient = relationship("Patient", back_populates="access_logs")

    __table_args__ = (
        Index("ix_access_logs_patient_timestamp", "patient_id", "timestamp"),
        Index("ix_access_logs_actor_timestamp", "actor_id", "timestamp"),
    )

    def __repr__(self):
        return f"<AccessLog {self.action} {self.resource_type} by {self.actor_name}>"


class ReminderQueue(Base):
    """Scheduled medication reminders."""
    __tablename__ = "reminder_queue"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)
    medication_request_id = Column(PGUUID(as_uuid=True), ForeignKey("medication_requests.id"), index=True, nullable=False)

    # When to send
    scheduled_at = Column(DateTime, index=True, nullable=False)

    # Channel
    channel = Column(String(20))  # push, sms, ivr
    channel_destination = Column(String(100))  # device token, phone number

    # Message
    message_template = Column(String(500))
    message_data = Column(JSONB)

    # Status
    status = Column(String(20), default="pending")  # pending, sent, delivered, failed, skipped
    attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    error_message = Column(Text)

    # Idempotency
    idempotency_key = Column(String(100), unique=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_reminder_queue_scheduled_status", "scheduled_at", "status"),
    )

    def __repr__(self):
        return f"<ReminderQueue {self.id} patient={self.patient_id} at={self.scheduled_at}>"


class SymptomIntake(Base):
    """Symptom intake session (from AI triage)."""
    __tablename__ = "symptom_intakes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=gen_uuid)

    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False)
    encounter_id = Column(PGUUID(as_uuid=True), ForeignKey("encounters.id"), index=True, nullable=True)

    # Session state
    session_id = Column(String(100), unique=True, index=True)
    current_question = Column(Integer, default=0)
    completed = Column(Boolean, default=False)

    # Responses (structured)
    responses = Column(JSONB, default=list)  # list of {question_id, answer, timestamp}

    # Structured output
    structured_output = Column(JSONB)  # SymptomIntakeResponse

    # Routing
    suggested_specialty = Column(String(100))
    suggested_doctor_id = Column(PGUUID(as_uuid=True), ForeignKey("practitioners.id"), nullable=True)
    triage_priority = Column(String(20), default="normal")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

    def __repr__(self):
        return f"<SymptomIntake {self.id} patient={self.patient_id} completed={self.completed}>"