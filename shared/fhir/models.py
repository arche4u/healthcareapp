"""
FHIR R4 Resource Models — Canonical schemas for OneHealth.
All services use these Pydantic models to ensure consistent, ABDM-compliant data shapes.
"""
from __future__ import annotations
from typing import Any, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID, uuid4


# ──────────────────────────────────────────────────────────────────────────────
# Primitive / reusable types
# ──────────────────────────────────────────────────────────────────────────────

class Coding(BaseModel):
    system: Optional[str] = None
    code: Optional[str] = None
    display: Optional[str] = None
    userSelected: Optional[bool] = None


class CodeableConcept(BaseModel):
    coding: list[Coding] = Field(default_factory=list)
    text: Optional[str] = None


class Identifier(BaseModel):
    use: Literal["usual", "official", "temp", "secondary", "old"] = "usual"
    type: Optional[CodeableConcept] = None
    system: Optional[str] = None
    value: str
    period: Optional[dict] = None
    assigner: Optional[dict] = None


class Period(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None


class Reference(BaseModel):
    reference: str
    type: Optional[str] = None
    identifier: Optional[Identifier] = None
    display: Optional[str] = None


class HumanName(BaseModel):
    use: Literal["usual", "official", "temp", "nickname", "anonymous", "old", "maiden"] = "official"
    text: Optional[str] = None
    family: Optional[str] = None
    given: list[str] = Field(default_factory=list)
    prefix: list[str] = Field(default_factory=list)
    suffix: list[str] = Field(default_factory=list)


class ContactPoint(BaseModel):
    system: Literal["phone", "fax", "email", "pager", "url", "sms", "other"] = "phone"
    value: Optional[str] = None
    use: Literal["home", "work", "temp", "old", "mobile"] = "mobile"
    rank: Optional[int] = None
    period: Optional[Period] = None


class Address(BaseModel):
    use: Literal["home", "work", "temp", "old", "billing"] = "home"
    type: Literal["postal", "physical", "both"] = "both"
    text: Optional[str] = None
    line: list[str] = Field(default_factory=list)
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None
    period: Optional[Period] = None


class Attachment(BaseModel):
    contentType: Optional[str] = None
    language: Optional[str] = None
    data: Optional[str] = None  # base64
    url: Optional[str] = None
    size: Optional[int] = None
    hash: Optional[str] = None
    title: Optional[str] = None
    creation: Optional[datetime] = None


class Annotation(BaseModel):
    authorReference: Optional[Reference] = None
    authorString: Optional[str] = None
    time: Optional[datetime] = None
    text: str


class Quantity(BaseModel):
    value: Optional[float] = None
    comparator: Literal["<", "<=", ">=", ">"] = None
    unit: Optional[str] = None
    system: Optional[str] = None
    code: Optional[str] = None


class Range(BaseModel):
    low: Optional[Quantity] = None
    high: Optional[Quantity] = None


class Ratio(BaseModel):
    numerator: Optional[Quantity] = None
    denominator: Optional[Quantity] = None


class Signature(BaseModel):
    type: list[Coding] = Field(default_factory=list)
    when: datetime
    who: Reference
    onBehalfOf: Optional[Reference] = None
    targetFormat: Optional[str] = None
    sigFormat: Optional[str] = None
    data: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Core FHIR R4 Resources used by OneHealth
# ──────────────────────────────────────────────────────────────────────────────

class Meta(BaseModel):
    versionId: Optional[str] = None
    lastUpdated: Optional[datetime] = None
    source: Optional[str] = None
    profiles: list[str] = Field(default_factory=list)
    security: list[Coding] = Field(default_factory=list)
    tags: list[Coding] = Field(default_factory=list)


class Narrative(BaseModel):
    status: Literal["generated", "extensions", "additional", "empty"]
    div: str


class Resource(BaseModel):
    """Base FHIR resource with common fields."""
    resourceType: str
    id: Optional[str] = None
    meta: Optional[Meta] = None
    implicitRules: Optional[str] = None
    language: Optional[str] = None
    text: Optional[Narrative] = None
    contained: list[Resource] = Field(default_factory=list)
    extension: list[dict] = Field(default_factory=list)
    modifierExtension: list[dict] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")  # allow FHIR extensions


# ── Patient ────────────────────────────────────────────────────────────────────

class PatientCommunication(BaseModel):
    language: CodeableConcept
    preferred: bool = False


class PatientLink(BaseModel):
    other: Reference
    type: Literal["replaced-by", "replaces", "refer", "seealso"]


class Patient(Resource):
    resourceType: Literal["Patient"] = "Patient"
    identifier: list[Identifier] = Field(default_factory=list)
    active: bool = True
    name: list[HumanName] = Field(default_factory=list)
    telecom: list[ContactPoint] = Field(default_factory=list)
    gender: Optional[Literal["male", "female", "other", "unknown"]] = None
    birthDate: Optional[str] = None  # YYYY-MM-DD
    deceasedBoolean: Optional[bool] = None
    deceasedDateTime: Optional[datetime] = None
    address: list[Address] = Field(default_factory=list)
    maritalStatus: Optional[CodeableConcept] = None
    multipleBirthBoolean: Optional[bool] = None
    multipleBirthInteger: Optional[int] = None
    photo: list[Attachment] = Field(default_factory=list)
    contact: list[dict] = Field(default_factory=list)  # PatientContact complex type
    communication: list[PatientCommunication] = Field(default_factory=list)
    generalPractitioner: list[Reference] = Field(default_factory=list)
    managingOrganization: Optional[Reference] = None
    link: list[PatientLink] = Field(default_factory=list)

    # OneHealth extensions (stored in JSONB)
    biometric_template_hash: Optional[str] = Field(default=None, alias="biometricTemplateHash")
    abha_id: Optional[str] = Field(default=None, alias="abhaId")
    consent_policy: Optional[dict] = Field(default=None, alias="consentPolicy")


# ── Practitioner (Doctor/Nurse) ────────────────────────────────────────────────

class PractitionerQualification(BaseModel):
    identifier: list[Identifier] = Field(default_factory=list)
    code: CodeableConcept
    period: Optional[Period] = None
    issuer: Optional[Reference] = None


class Practitioner(Resource):
    resourceType: Literal["Practitioner"] = "Practitioner"
    identifier: list[Identifier] = Field(default_factory=list)
    active: bool = True
    name: list[HumanName] = Field(default_factory=list)
    telecom: list[ContactPoint] = Field(default_factory=list)
    address: list[Address] = Field(default_factory=list)
    gender: Optional[Literal["male", "female", "other", "unknown"]] = None
    birthDate: Optional[str] = None
    photo: list[Attachment] = Field(default_factory=list)
    qualification: list[PractitionerQualification] = Field(default_factory=list)
    communication: list[CodeableConcept] = Field(default_factory=list)

    # OneHealth: hospital affiliation via extension
    hospital_id: Optional[str] = Field(default=None, alias="hospitalId")
    hpr_id: Optional[str] = Field(default=None, alias="hprId")


# ── Organization (Hospital) ────────────────────────────────────────────────────

class OrganizationContact(BaseModel):
    purpose: Optional[CodeableConcept] = None
    name: Optional[HumanName] = None
    telecom: list[ContactPoint] = Field(default_factory=list)
    address: Optional[Address] = None


class Organization(Resource):
    resourceType: Literal["Organization"] = "Organization"
    identifier: list[Identifier] = Field(default_factory=list)
    active: bool = True
    type: list[CodeableConcept] = Field(default_factory=list)
    name: Optional[str] = None
    alias: list[str] = Field(default_factory=list)
    telecom: list[ContactPoint] = Field(default_factory=list)
    address: list[Address] = Field(default_factory=list)
    partOf: Optional[Reference] = None
    contact: list[OrganizationContact] = Field(default_factory=list)
    endpoint: list[Reference] = Field(default_factory=list)

    # OneHealth
    hfr_id: Optional[str] = Field(default=None, alias="hfrId")
    adapter_config: Optional[dict] = Field(default=None, alias="adapterConfig")


# ── Encounter (Visit) ──────────────────────────────────────────────────────────

class EncounterStatusHistory(BaseModel):
    status: Literal["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled", "entered-in-error", "unknown"]
    period: Period


class EncounterParticipant(BaseModel):
    type: list[CodeableConcept] = Field(default_factory=list)
    period: Optional[Period] = None
    individual: Optional[Reference] = None


class EncounterDiagnosis(BaseModel):
    condition: Reference
    use: Optional[CodeableConcept] = None
    rank: Optional[int] = None


class EncounterHospitalization(BaseModel):
    preAdmissionIdentifier: Optional[Identifier] = None
    origin: Optional[Reference] = None
    admitSource: Optional[CodeableConcept] = None
    reAdmission: Optional[CodeableConcept] = None
    dietPreference: list[CodeableConcept] = Field(default_factory=list)
    specialCourtesy: list[CodeableConcept] = Field(default_factory=list)
    specialArrangement: list[CodeableConcept] = Field(default_factory=list)
    destination: Optional[Reference] = None
    dischargeDisposition: Optional[CodeableConcept] = None


class Encounter(Resource):
    resourceType: Literal["Encounter"] = "Encounter"
    identifier: list[Identifier] = Field(default_factory=list)
    status: Literal["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled", "entered-in-error", "unknown"]
    statusHistory: list[EncounterStatusHistory] = Field(default_factory=list)
    class_: CodeableConcept = Field(alias="class")
    classHistory: list[CodeableConcept] = Field(default_factory=list, alias="classHistory")
    type: list[CodeableConcept] = Field(default_factory=list)
    serviceType: Optional[CodeableConcept] = None
    priority: Optional[CodeableConcept] = None
    subject: Reference
    episodeOfCare: list[Reference] = Field(default_factory=list)
    basedOn: list[Reference] = Field(default_factory=list)
    participant: list[EncounterParticipant] = Field(default_factory=list)
    appointment: Optional[Reference] = None
    period: Optional[Period] = None
    length: Optional[Quantity] = None
    reasonCode: list[CodeableConcept] = Field(default_factory=list)
    reasonReference: list[Reference] = Field(default_factory=list)
    diagnosis: list[EncounterDiagnosis] = Field(default_factory=list)
    account: list[Reference] = Field(default_factory=list)
    hospitalization: Optional[EncounterHospitalization] = None
    location: list[dict] = Field(default_factory=list)  # EncounterLocation complex
    serviceProvider: Optional[Reference] = None
    partOf: Optional[Reference] = None
    notes: Optional[str] = None

    model_config = ConfigDict(extra="allow")


# ── Observation (Vitals, Lab Results) ──────────────────────────────────────────

class ObservationComponent(BaseModel):
    code: CodeableConcept
    valueQuantity: Optional[Quantity] = None
    valueCodeableConcept: Optional[CodeableConcept] = None
    valueString: Optional[str] = None
    valueBoolean: Optional[bool] = None
    valueInteger: Optional[int] = None
    valueRange: Optional[Range] = None
    valueRatio: Optional[Ratio] = None
    dataAbsentReason: Optional[CodeableConcept] = None
    interpretation: list[CodeableConcept] = Field(default_factory=list)
    referenceRange: list[dict] = Field(default_factory=list)


class ObservationReferenceRange(BaseModel):
    low: Optional[Quantity] = None
    high: Optional[Quantity] = None
    type: Optional[CodeableConcept] = None
    appliesTo: list[CodeableConcept] = Field(default_factory=list)
    age: Optional[Range] = None
    text: Optional[str] = None


class Observation(Resource):
    resourceType: Literal["Observation"] = "Observation"
    identifier: list[Identifier] = Field(default_factory=list)
    basedOn: list[Reference] = Field(default_factory=list)
    partOf: list[Reference] = Field(default_factory=list)
    status: Literal["registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error", "unknown"]
    category: list[CodeableConcept] = Field(default_factory=list)
    code: CodeableConcept
    subject: Optional[Reference] = None
    focus: list[Reference] = Field(default_factory=list)
    encounter: Optional[Reference] = None
    effectiveDateTime: Optional[datetime] = None
    effectivePeriod: Optional[Period] = None
    effectiveTiming: Optional[dict] = None
    issued: Optional[datetime] = None
    performer: list[Reference] = Field(default_factory=list)
    valueQuantity: Optional[Quantity] = None
    valueCodeableConcept: Optional[CodeableConcept] = None
    valueString: Optional[str] = None
    valueBoolean: Optional[bool] = None
    valueInteger: Optional[int] = None
    valueRange: Optional[Range] = None
    valueRatio: Optional[Ratio] = None
    valueSampledData: Optional[dict] = None
    valueTime: Optional[str] = None
    valueDateTime: Optional[datetime] = None
    valuePeriod: Optional[Period] = None
    dataAbsentReason: Optional[CodeableConcept] = None
    interpretation: list[CodeableConcept] = Field(default_factory=list)
    note: list[Annotation] = Field(default_factory=list)
    bodySite: Optional[CodeableConcept] = None
    method: Optional[CodeableConcept] = None
    specimen: Optional[Reference] = None
    device: Optional[Reference] = None
    referenceRange: list[ObservationReferenceRange] = Field(default_factory=list)
    hasMember: list[Reference] = Field(default_factory=list)
    derivedFrom: list[Reference] = Field(default_factory=list)
    component: list[ObservationComponent] = Field(default_factory=list)


# ── MedicationRequest (Prescription) ───────────────────────────────────────────

class MedicationRequestDispenseRequest(BaseModel):
    medication: Optional[Reference] = None
    validityPeriod: Optional[Period] = None
    numberOfRepeatsAllowed: Optional[int] = None
    quantity: Optional[Quantity] = None
    expectedSupplyDuration: Optional[Quantity] = None
    performer: Optional[Reference] = None


class MedicationRequestSubstitution(BaseModel):
    allowedBoolean: Optional[bool] = None
    allowedCodeableConcept: Optional[CodeableConcept] = None
    reason: Optional[CodeableConcept] = None


class MedicationRequest(Resource):
    resourceType: Literal["MedicationRequest"] = "MedicationRequest"
    identifier: list[Identifier] = Field(default_factory=list)
    status: Literal["active", "on-hold", "cancelled", "completed", "entered-in-error", "stopped", "draft", "unknown"]
    statusReason: Optional[CodeableConcept] = None
    intent: Literal["proposal", "plan", "order", "original-order", "reflex-order", "filler-order", "instance-order", "option"]
    category: list[CodeableConcept] = Field(default_factory=list)
    priority: Optional[Literal["routine", "urgent", "asap", "stat"]] = "routine"
    doNotPerform: Optional[bool] = None
    reportedBoolean: Optional[bool] = None
    reportedReference: Optional[Reference] = None
    medicationCodeableConcept: Optional[CodeableConcept] = None
    medicationReference: Optional[Reference] = None
    subject: Reference
    encounter: Optional[Reference] = None
    supportingInformation: list[Reference] = Field(default_factory=list)
    authoredOn: Optional[datetime] = None
    requester: Optional[Reference] = None
    performer: Optional[Reference] = None
    performerType: Optional[CodeableConcept] = None
    recorder: Optional[Reference] = None
    reasonCode: list[CodeableConcept] = Field(default_factory=list)
    reasonReference: list[Reference] = Field(default_factory=list)
    instantiatesCanonical: list[str] = Field(default_factory=list)
    instantiatesUri: list[str] = Field(default_factory=list)
    basedOn: list[Reference] = Field(default_factory=list)
    groupIdentifier: Optional[Identifier] = None
    courseOfTherapyType: Optional[CodeableConcept] = None
    insurance: list[Reference] = Field(default_factory=list)
    note: list[Annotation] = Field(default_factory=list)
    dosageInstruction: list[dict] = Field(default_factory=list)  # Dosage complex
    dispenseRequest: Optional[MedicationRequestDispenseRequest] = None
    substitution: Optional[MedicationRequestSubstitution] = None
    priorPrescription: Optional[Reference] = None
    detectedIssue: list[Reference] = Field(default_factory=list)
    eventHistory: list[Reference] = Field(default_factory=list)

    # OneHealth: reminder schedule encoded in dosageInstruction.timing
    reminder_schedule: Optional[dict] = Field(default=None, alias="reminderSchedule")


# ── DiagnosticReport (Lab Reports) ─────────────────────────────────────────────

class DiagnosticReportMedia(BaseModel):
    comment: Optional[str] = None
    link: Reference


class DiagnosticReport(Resource):
    resourceType: Literal["DiagnosticReport"] = "DiagnosticReport"
    identifier: list[Identifier] = Field(default_factory=list)
    basedOn: list[Reference] = Field(default_factory=list)
    partOf: list[Reference] = Field(default_factory=list)
    status: Literal["registered", "partial", "preliminary", "final", "amended", "corrected", "appended", "cancelled", "entered-in-error", "unknown"]
    category: list[CodeableConcept] = Field(default_factory=list)
    code: CodeableConcept
    subject: Optional[Reference] = None
    encounter: Optional[Reference] = None
    effectiveDateTime: Optional[datetime] = None
    effectivePeriod: Optional[Period] = None
    issued: Optional[datetime] = None
    performer: list[Reference] = Field(default_factory=list)
    resultsInterpreter: list[Reference] = Field(default_factory=list)
    specimen: list[Reference] = Field(default_factory=list)
    result: list[Reference] = Field(default_factory=list)
    imagingStudy: list[Reference] = Field(default_factory=list)
    media: list[DiagnosticReportMedia] = Field(default_factory=list)
    conclusion: Optional[str] = None
    conclusionCode: list[CodeableConcept] = Field(default_factory=list)
    presentedForm: list[Attachment] = Field(default_factory=list)


# ── Consent (ABDM-style) ───────────────────────────────────────────────────────

class ConsentPolicy(BaseModel):
    authority: Optional[str] = None
    uri: Optional[str] = None


class ConsentPolicyRule(BaseModel):
    type: Coding
    period: Optional[Period] = None
    securityLabel: list[Coding] = Field(default_factory=list)


class ConsentProvision(BaseModel):
    type: Literal["deny", "permit"]
    period: Optional[Period] = None
    actor: list[dict] = Field(default_factory=list)  # ConsentActor complex
    action: list[CodeableConcept] = Field(default_factory=list)
    securityLabel: list[Coding] = Field(default_factory=list)
    purpose: list[Coding] = Field(default_factory=list)
    class_: list[CodeableConcept] = Field(default_factory=list, alias="class")
    code: list[CodeableConcept] = Field(default_factory=list)
    dataPeriod: Optional[Period] = None
    data: list[dict] = Field(default_factory=list)  # ConsentData complex


class Consent(Resource):
    resourceType: Literal["Consent"] = "Consent"
    identifier: list[Identifier] = Field(default_factory=list)
    status: Literal["draft", "proposed", "active", "rejected", "inactive", "entered-in-error"]
    scope: CodeableConcept
    category: list[CodeableConcept] = Field(default_factory=list)
    patient: Reference
    dateTime: Optional[datetime] = None
    performer: list[Reference] = Field(default_factory=list)
    organization: list[Reference] = Field(default_factory=list)
    sourceCanonical: Optional[str] = None
    sourceUri: Optional[str] = None
    policy: list[ConsentPolicy] = Field(default_factory=list)
    policyRule: Optional[ConsentPolicyRule] = None
    verification: list[dict] = Field(default_factory=list)  # ConsentVerification
    provision: Optional[ConsentProvision] = None


# ──────────────────────────────────────────────────────────────────────────────
# OneHealth-specific composite types
# ──────────────────────────────────────────────────────────────────────────────

class PatientBundle(BaseModel):
    """Complete patient record bundle returned by identity-svc."""
    model_config = ConfigDict(populate_by_name=True)

    patient: Patient
    encounters: list[Encounter] = Field(default_factory=list)
    observations: list[Observation] = Field(default_factory=list)
    medications: list[MedicationRequest] = Field(default_factory=list)
    diagnostic_reports: list[DiagnosticReport] = Field(default_factory=list, alias="diagnosticReports")
    consents: list[Consent] = Field(default_factory=list)
    access_logs: list[dict] = Field(default_factory=list, alias="accessLogs")


class DoctorQueueItem(BaseModel):
    """Single patient in a doctor's daily queue."""
    encounter: Encounter
    patient: Patient
    intake_summary: Optional[dict] = Field(default=None, alias="intakeSummary")
    triage_priority: Literal["low", "normal", "high", "urgent"] = "normal"
    assigned_doctor: Optional[Reference] = Field(default=None, alias="assignedDoctor")


class SymptomIntakeResponse(BaseModel):
    """Structured output from the 10-question AI intake flow."""
    chief_complaint: str
    duration_days: int
    severity: Literal["mild", "moderate", "severe", "critical"]
    associated_symptoms: list[str]
    relevant_history: list[str]
    red_flags: list[str]
    suggested_specialty: Optional[str] = None
    confidence: float


# ──────────────────────────────────────────────────────────────────────────────
# Helper factories
# ──────────────────────────────────────────────────────────────────────────────

def new_id(prefix: str = "") -> str:
    return f"{prefix}{uuid4().hex[:12]}"


def patient_ref(patient_id: str) -> Reference:
    return Reference(reference=f"Patient/{patient_id}", type="Patient")


def encounter_ref(encounter_id: str) -> Reference:
    return Reference(reference=f"Encounter/{encounter_id}", type="Encounter")


def practitioner_ref(practitioner_id: str) -> Reference:
    return Reference(reference=f"Practitioner/{practitioner_id}", type="Practitioner")


def organization_ref(org_id: str) -> Reference:
    return Reference(reference=f"Organization/{org_id}", type="Organization")


if __name__ == "__main__":
    # Quick validation
    p = Patient(
        id="pat-001",
        identifier=[Identifier(system="https://abdm.gov.in/abha", value="14-1234-5678-9012")],
        name=[HumanName(family="Sharma", given=["Priya"])],
        gender="female",
        birthDate="1990-05-15",
        abha_id="14-1234-5678-9012",
    )
    print(p.model_dump_json(indent=2, by_alias=True))