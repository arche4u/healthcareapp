# OneHealth — Unified Patient-Centric Care Platform

**OneHealth** unifies a patient's medical history across every hospital they visit, identified through a single biometric (fingerprint) credential. Patients get one lifelong, portable health record instead of fragmented paper files and hospital-specific logins.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│  ┌──────────────┐     ┌───────────────────┐     ┌───────────────┐  │
│  │  Landing     │     │  Doctor Dashboard │     │  Patient PWA  │  │
│  │  (3D/3JS)    │     │  (Next.js)        │     │  (React)      │  │
│  └──────────────┘     └───────────────────┘     └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Flask Microservices)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Auth Service │  │ Identity Svc │  │  Intake AI / Reminder /  │  │
│  │  (JWT/OAuth) │  │(FHIR/Patient)│  │     Prediction Services  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             ┌────────────┐       ┌──────────────┐
             │ PostgreSQL │       │    Redis     │
             │  (FHIR DB) │       │  (Cache/Queue)│
             └────────────┘       └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** — for running all services in one command
- **Python 3.12+** — for local backend development
- **Node.js 20+** — for local frontend development

### Option A: Full Stack via Docker (Recommended)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and start all services
docker-compose up --build

# 3. Seed the database (first time only)
docker-compose --profile init run init-db
```

**Services will be available at:**
- Landing Page: http://localhost:3000
- Auth API: http://localhost:5000
- Identity API: http://localhost:5001
- Intake AI: http://localhost:5002
- Reminders: http://localhost:5003
- Dashboard: http://localhost:3001
- MinIO Console: http://localhost:9001

### Option B: Local Development

```bash
# 1. Start infrastructure
docker-compose up postgres redis minio -d

# 2. Seed database
python scripts/init_db.py

# 3. Start backend services
cd services/auth-svc && pip install -r requirements.txt && python app.py
cd services/identity-svc && pip install -r requirements.txt && python app.py
# ... and so on for other services

# 4. Start frontend
cd web && npm ci && npm run dev
```

## 🔐 Test Credentials

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@onehealth.example.com | Admin@123 |
| **Doctor** | dr.rao@onehealth.example.com | Doctor@123 |
| **Patient** | priya.sharma@example.com | Patient@123 |
| **Nurse** | nurse.smith@onehealth.example.com | Nurse@123 |

## 📁 Project Structure

```
onehealth/
├── docker-compose.yml           # All services + infra
├── Caddyfile                    # Reverse proxy config
├── CLAUDE.md                    # Claude Code project guide
├── scripts/
│   ├── init_db.py               # DB init + seed data
│   └── requirements.txt         # Python deps for init
├── shared/                      # Shared Python SDK
│   ├── fhir/models.py           # FHIR R4 Pydantic models
│   └── sdk/
│       ├── database.py          # DB connection & session
│       ├── cache.py             # Redis cache utilities
│       ├── auth.py              # JWT auth middleware
│       ├── fhir_client.py       # FHIR/HIS adapter client
│       └── models.py            # SQLAlchemy ORM models
├── services/
│   ├── auth-svc/                # JWT/OAuth2 auth server
│   ├── identity-svc/            # Patient lookup + biometrics
│   ├── dashboard-svc/           # Doctor dashboard (Next.js)
│   ├── intake-ai-svc/           # AI symptom triage (stub)
│   ├── reminder-svc/            # Medication reminders
│   └── prediction-svc/          # Next-visit prediction
└── web/                         # Frontend (Landing + Auth)
    ├── app/
    │   ├── page.tsx             # Landing page (3D)
    │   └── auth/signin/page.tsx # Auth page
    ├── components/
    │   ├── canvas/HealthScene.tsx  # Three.js 3D scene
    │   └── landing/             # Landing page sections
    └── lib/
        ├── api.ts               # API client
        └── utils.ts             # Utilities
```

## 🔬 API Reference

### Auth Service
```
POST /auth/register        # Register new user
POST /auth/login           # Login → JWT tokens
POST /auth/token           # Token refresh
GET  /auth/userinfo        # Current user info
POST /auth/revoke          # Revoke token
```

### Identity Service
```
POST /identity/patients            # Create patient
GET  /identity/patients/:id        # Get patient
GET  /identity/patients/:id/bundle # Get full FHIR bundle
POST /identity/fingerprint/match   # Biometric matching
POST /identity/abha/link           # Link ABHA ID
GET  /identity/search?q=...        # Search patients
GET  /identity/queue/hospital/:id  # Doctor queue
```

### Intake AI Service
```
GET  /intake/questions     # Get 10-question flow
POST /intake/start         # Start intake session
POST /intake/:id/answer    # Submit answer
GET  /intake/:id/summary   # Get structured output
```

### Reminder Service
```
POST /reminders/schedule              # Schedule reminder
POST /reminders/from-prescription     # Auto-schedule from Rx
GET  /reminders/patient/:id           # Get upcoming reminders
POST /reminders/:id/acknowledge       # Mark dose taken/skipped
```

## 🔒 Security

- **Fingerprint**: Stored as irreversible hash/templates, never raw images
- **JWT**: Hospital-scoped tokens with role-based scopes
- **Consent**: Every cross-hospital access requires patient consent
- **Audit**: Complete access log for compliance (ABDM/DISHA)
- **Encryption**: All clinical data encrypted at rest and in transit

## 📝 Data Model (FHIR R4 Aligned)

All backend resources map to FHIR R4 standard:

| FHIR Resource | Local Use |
|---------------|-----------|
| `Patient` | ABHA ID, biometric template, demographics |
| `Encounter` | Hospital visit, OPD/Surgery |
| `Observation` | Vitals (BP, glucose, weight, SpO2) |
| `MedicationRequest` | E-prescriptions with reminder schedule |
| `DiagnosticReport` | Lab results |
| `Consent` | ABDM-style consent records |

## 🧪 Testing

```bash
# Run with real database
docker-compose up --build
curl http://localhost:5000/auth/login -X POST -d '{"email":"dr.rao@onehealth.example.com","password":"Doctor@123"}'
```

## 🚀 Deployment

### Production Docker
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stages
1. **Local Dev**: `docker-compose up --build`
2. **Single Hospital**: Docker-compose + MinIO
3. **Multi-Hospital**: k3s/Nomad cluster
4. **Cloud**: AWS/GCP with VPC isolation

---

## 🎯 Phase Roadmap

| Phase | Scope |
|-------|-------|
| **Phase 1** | Fingerprint check-in, ABHA linking, Doctor dashboard, Basic reminders |
| **Phase 2** | Multi-hospital federation, AI symptom intake, Next-visit prediction |
| **Phase 3** | Voice-first, Multi-language, Surgery workflow, ML-based prediction |

---

Built for India's healthcare ecosystem. FHIR-native. ABDM-ready. Open-source.