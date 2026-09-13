# OneHealth - Build Summary

## What Was Built

A complete production-foundation scaffold for the OneHealth unified patient-centric care platform, including:

### 1. Backend Microservices (Python/Flask)
| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **auth-svc** | 5000 | JWT/OAuth2 authentication server | Fully wired |
| **identity-svc** | 5001 | Patient lookup, biometric matching, ABHA linking | Fully wired |
| **intake-ai-svc** | 5002 | AI symptom triage (10-question flow) | Production stubs |
| **reminder-svc** | 5003 | Medication reminders (push/SMS/IVR) | Production stubs |
| **prediction-svc** | 5004 | Next-visit prediction (rules-based) | Production stubs |

### 2. Frontend Applications (Next.js/React)
| App | Port | Description | Status |
|-----|------|-------------|--------|
| **Web Landing** | 3000 | 3D animated landing page + auth pages | Complete |
| **Dashboard** | 3001 | Doctor dashboard (queue, patient records) | Complete |
| **Patient PWA** | - | Offline-ready patient app (service worker) | Complete |

### 3. Shared Libraries
- **FHIR R4 Models**: Pydantic models for Patient, Encounter, Observation, MedicationRequest, DiagnosticReport, Consent
- **SQLAlchemy ORM**: PostgreSQL models with JSONB for FHIR data
- **Auth SDK**: JWT token creation, decoding, middleware decorators
- **Cache SDK**: Redis-backed caching utilities
- **FHIR Client**: Hospital adapter interface (stubbed)

### 4. Infrastructure
- **Docker Compose**: All services + Postgres + Redis + MinIO
- **Caddy**: Reverse proxy with auto-HTTPS
- **Database Init**: Script to create tables and seed test data

## File Structure
```
onehealth/
├── docker-compose.yml           # All services orchestration
├── Caddyfile                    # Reverse proxy config
├── CLAUDE.md                    # Project guide
├── README.md                    # Documentation
├── .env.example                 # Environment template
├── scripts/
│   ├── init_db.py              # DB init + seed data
│   └── requirements.txt
├── shared/
│   ├── fhir/models.py          # FHIR R4 Pydantic models
│   └── sdk/
│       ├── __init__.py
│       ├── database.py         # DB connection
│       ├── cache.py            # Redis cache
│       ├── auth.py             # JWT auth
│       ├── fhir_client.py      # FHIR client
│       └── models.py           # SQLAlchemy models
├── services/
│   ├── auth-svc/               # JWT auth server
│   ├── identity-svc/           # Patient lookup
│   ├── dashboard-svc/          # Doctor dashboard
│   ├── intake-ai-svc/          # AI triage
│   ├── reminder-svc/           # Medication reminders
│   └── prediction-svc/         # Next-visit prediction
└── web/                        # Landing page + PWA
    ├── app/
    │   ├── page.tsx            # Landing page
    │   ├── auth/signin/        # Auth pages
    │   └── dashboard/          # Dashboard
    ├── components/
    │   ├── canvas/             # Three.js 3D scene
    │   └── landing/            # Landing sections
    └── lib/                    # API client, utils
```

## Test Credentials (Seeded Data)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@onehealth.example.com | Admin@123 |
| Doctor | dr.rao@onehealth.example.com | Doctor@123 |
| Patient | priya.sharma@example.com | Patient@123 |
| Nurse | nurse.smith@onehealth.example.com | Nurse@123 |

## Sample Data
- 1 Hospital (OneHealth Medical Center, Gurugram)
- 2 Patients (Priya Sharma with ABHA, Rajkumar Patel pending)
- 1 Encounter (OPD visit)
- 2 Vitals (BP, Glucose)
- 1 Prescription (Amoxicillin with reminders)
- 1 Consent record

## How to Run

### Option 1: Docker (Recommended)
```bash
cd /d/onehealth/onehealth
cp .env.example .env
docker-compose up --build
```

Services available at:
- http://localhost:3000 (Landing page)
- http://localhost:3001 (Doctor dashboard)
- http://localhost:5000 (Auth API)
- http://localhost:5001 (Identity API)
- http://localhost:9001 (MinIO console)

### Option 2: Local Development
```bash
# Start infrastructure
docker-compose up postgres redis minio -d

# Seed database
python scripts/init_db.py

# Start backend services (separate terminals)
cd services/auth-svc && pip install -r requirements.txt && python app.py
cd services/identity-svc && pip install -r requirements.txt && python app.py
# ... etc

# Start frontend
cd web && npm install && npm run dev
```

## Verification Steps
1. **Database**: `docker-compose ps` → all services healthy
2. **Auth**: `curl http://localhost:5000/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"dr.rao@onehealth.example.com","password":"Doctor@123"}'`
3. **Landing Page**: Open http://localhost:3000 → 3D scene renders
4. **Dashboard**: Sign in → http://localhost:3001/dashboard → see patient queue
5. **Patient Detail**: Click patient → see vitals, prescriptions, history

## Build Status
- ✅ Web app builds successfully
- ✅ Dashboard builds successfully
- ✅ All Python files compile without syntax errors
- ✅ All imports resolve correctly
- ⚠️ 3D scene requires browser with WebGL support

## Next Steps to Full Production
1. **Fingerprint Integration**: Connect to UIDAI-certified scanner via RD Service
2. **Real AI**: Deploy Ollama + Whisper containers for actual voice/symptom processing
3. **SMS/IVR**: Integrate with Twilio or Indian SMS gateway
4. **ABDM**: Connect to ABHA/Consent Manager APIs
5. **Monitoring**: Add Prometheus + Grafana
6. **Backups**: Configure encrypted PostgreSQL + MinIO backups