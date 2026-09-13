# OneHealth - Claude Code Project Guide

## Project Overview
OneHealth is a patient-centric healthcare platform for India that unifies medical history across hospitals using biometric check-in (fingerprint) + ABHA, AI symptom intake, automated medication reminders, and cross-hospital record sharing with patient consent.

## Architecture
- **Frontend**: Next.js 14 (React 18) + Three.js (3D landing) + Framer Motion
- **Auth Service**: Flask + JWT/OAuth2 (port 5000)
- **Identity Service**: Flask (port 5001)
- **Dashboard Service**: Next.js (port 3001)
- **Intake AI Service**: Flask + Ollama/Whisper stubs (port 5002)
- **Reminder Service**: Flask + Celery (port 5003)
- **Prediction Service**: Flask (port 5004)
- **Database**: PostgreSQL 16, Redis, MinIO (object storage)
- **Gateway**: Caddy reverse proxy (ports 80/443)

## Structure
```
onehealth/
├── docker-compose.yml          # All services + infra
├── Caddyfile                   # Reverse proxy config
├── Dockerfile.init             # DB init container
├── .env.example                # Environment template
├── scripts/                    # DB init + seeds
│   └── init_db.py
├── shared/                     # Shared Python SDK
│   ├── fhir/models.py          # FHIR R4 Pydantic models
│   └── sdk/                    # DB, cache, auth, FHIR client
│       ├── __init__.py
│       ├── database.py
│       ├── cache.py
│       ├── auth.py
│       ├── fhir_client.py
│       └── models.py
├── services/                   # Backend microservices
│   ├── auth-svc/               # JWT auth server
│   ├── identity-svc/           # Patient lookup + biometrics
│   ├── dashboard-svc/          # Doctor dashboard (Next.js)
│   ├── intake-ai-svc/          # AI symptom triage
│   ├── reminder-svc/           # Medication reminders
│   └── prediction-svc/         # Next-visit prediction
├── web/                        # Frontend (Next.js)
│   ├── app/                    # Pages (landing, auth)
│   │   └── auth/signin/page.tsx
│   ├── components/             # UI components
│   │   ├── canvas/HealthScene.tsx  # 3D scene
│   │   └── landing/            # Landing page sections
│   ├── lib/                    # Utilities + API client
│   └── styles/                 # Tailwind CSS
└── CLAUDE.md                   # This file
```

## Development

### Quick Start
```bash
# 1. Copy env
cp .env.example .env

# 2. Start all services (Postgres, Redis, MinIO, all microservices, web)
docker-compose up --build

# 3. Run DB init (if profiles not enabled)
docker-compose --profile init up init-db
```

### Development (without Docker)
```bash
# Backend services
export FLASK_APP=services/auth-svc/app.py
cd services/auth-svc && pip install -r requirements.txt && flask run -p 5000

# Frontend
cd web && npm ci && npm run dev
```

### Seeding the Database
The `init_db.py` script creates all tables and seeds:
- 1 hospital (OneHealth Medical Center)
- 1 admin, 1 doctor (Dr. Rao), 1 nurse
- 2 patients (Priya Sharma with ABHA, Rajkumar Patel pending)
- 1 encounter, vitals, prescription, consent

## Testing Credentials
- **Admin**: admin@onehealth.example.com / Admin@123
- **Doctor**: dr.rao@onehealth.example.com / Doctor@123
- **Patient**: priya.sharma@example.com / Patient@123

## Adding a New Service
1. Create `services/new-svc/` directory
2. Add `Dockerfile` and `requirements.txt` (copy from auth-svc pattern)
3. Add to `docker-compose.yml`
4. Add route to `Caddyfile`
5. Share `shared/` SDK for FHIR/DB/auth utilities

## API Patterns
- All services use JWT Bearer auth: `Authorization: Bearer <token>`
- Token carries: `sub`, `hospital_id`, `role`, `scopes`
- FHIR resources: Patient, Encounter, Observation, MedicationRequest, etc.
- Stub responses include `X-Stub: true` header

## Key Design Decisions
- FHIR R4 as internal schema → ABDM compliance is additive, not a migration
- Hospital-scoped RBAC → doctors only see their hospital's patients
- Biosecrypt: fingerprints stored as irreversible templates, never raw images
- Consent-first → every cross-hospital access requires patient consent
- Offline-tolerant → Redis-backed queue for internet outages