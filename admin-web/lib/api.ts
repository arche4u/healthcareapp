/**
 * API client for communicating with OneHealth backend services.
 * Supports both local dev (http://localhost:*) and production (https://api.onehealth.example.com).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost";
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost/api/auth";

/**
 * Get JWT token from localStorage.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/**
 * Set JWT tokens in localStorage.
 */
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("accessToken", access);
  if (refresh) {
    localStorage.setItem("refreshToken", refresh);
  }
}

/**
 * Clear tokens (logout).
 */
export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

/**
 * Decode a JWT token to get its payload.
 */
export function decodeJWT(token: string): any | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

/**
 * Get the current user's role from their token.
 */
export function getAuthRole(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = decodeJWT(token);
  return payload?.role || null;
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return false;
  
  return Date.now() < payload.exp * 1000;
}

/**
 * Base fetch wrapper that includes auth headers.
 */
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * API endpoints for auth.
 */
export const authAPI = {
  login: async (email: string, password: string) =>
    apiFetch(`${AUTH_BASE_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json()),

  register: async (data: Record<string, any>) =>
    apiFetch(`${AUTH_BASE_URL}/register`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  userinfo: async () =>
    apiFetch(`${AUTH_BASE_URL}/userinfo`, {
      method: "GET",
    }).then((r) => r.json()),

  revoke: async () =>
    apiFetch(`${AUTH_BASE_URL}/revoke`, {
      method: "POST",
    }).then((r) => r.json()),

  updateProfile: async (data: { full_name?: string; email?: string; password?: string }) =>
    apiFetch(`${AUTH_BASE_URL}/users/me`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getHospitals: async () =>
    apiFetch(`${AUTH_BASE_URL}/hospitals`, {
      method: "GET",
    }).then((r) => r.json()),

  getDoctors: async (hospitalId: string) =>
    apiFetch(`${AUTH_BASE_URL}/doctors/hospital/${hospitalId}`, {
      method: "GET",
    }).then((r) => r.json()),

  registerHospital: async (data: {
    email: string;
    password: string;
    full_name: string;
    hospital_name: string;
    hospital_city?: string;
    hospital_state?: string;
    phone?: string;
  }) =>
    apiFetch(`${AUTH_BASE_URL}/register-hospital`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  registerStaff: async (data: {
    email: string;
    password: string;
    full_name: string;
    role: "doctor" | "nurse";
    specialty?: string;
    phone?: string;
  }) =>
    apiFetch(`${AUTH_BASE_URL}/staff`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getStaff: async () =>
    apiFetch(`${AUTH_BASE_URL}/staff`, {
      method: "GET",
    }).then((r) => r.json()),
};


/**
 * API endpoints for identity service.
 */
export const identityAPI = {
  getPatient: async (patientId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/patients/${patientId}`, {
      method: "GET",
    }).then((r) => r.json()),

  getPatientBundle: async (patientId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/patients/${patientId}/bundle`, {
      method: "GET",
    }).then((r) => r.json()),

  getPatientFamily: async (patientId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/patient/${patientId}/family`, {
      method: "GET",
    }).then((r) => r.json()),

  createPatient: async (data: Record<string, any>) =>
    apiFetch(`${API_BASE_URL}/api/identity/patients`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  fingerprintMatch: async (fingerprintHash: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/fingerprint/match`, {
      method: "POST",
      body: JSON.stringify({ fingerprint_hash: fingerprintHash }),
    }).then((r) => r.json()),

  checkInFace: async (image: string, hospitalId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/checkin-face`, {
      method: "POST",
      body: JSON.stringify({ image, hospital_id: hospitalId }),
    }).then((r) => r.json()),

  linkABHA: async (patientId: string, abhaId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/abha/link`, {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId, abha_id: abhaId }),
    }).then((r) => r.json()),

  searchPatients: async (params: Record<string, string>) =>
    apiFetch(
      `${API_BASE_URL}/api/identity/search${new URLSearchParams(params).toString() ? "?" + new URLSearchParams(params).toString() : ""}`,
      {
        method: "GET",
      }
    ).then((r) => r.json()),

  getHospitalQueue: async (hospitalId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/queue/hospital/${hospitalId}`, {
      method: "GET",
    }).then((r) => r.json()),

  registerFace: async (patientId: string, image: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/register-face`, {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId, image }),
    }).then((r) => r.json()),

  getDoctorsWorkload: async (hospitalId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/hospitals/${hospitalId}/doctors-workload`, {
      method: "GET",
    }).then((r) => r.json()),

  assignDoctor: async (encounterId: string, doctorUserId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/assign-doctor`, {
      method: "POST",
      body: JSON.stringify({ doctor_user_id: doctorUserId }),
    }).then((r) => r.json()),
};



/**
 * API endpoints for patient appointments (encounters).
 */
export const appointmentsAPI = {
  list: async (patientId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/patients/${patientId}/encounters`, {
      method: "GET",
    }).then((r) => r.json()),

  book: async (
    patientId: string,
    data: {
      hospital_id: string;
      practitioner_id?: string;
      period_start: string; // ISO 8601
      reason?: string;
    }
  ) =>
    apiFetch(`${API_BASE_URL}/api/identity/patients/${patientId}/encounters`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  cancel: async (encounterId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/cancel`, {
      method: "PATCH",
    }).then((r) => r.json()),
    
  listForHospital: async (hospitalId: string, status?: string) =>
    apiFetch(
      `${API_BASE_URL}/api/identity/hospitals/${hospitalId}/encounters${status ? "?status=" + status : ""}`,
      { method: "GET" }
    ).then((r) => r.json()),
    
  triage: async (encounterId: string, data: Record<string, string>) => {
    const res = await apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/triage`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json());
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'intake_completed', encounterId })
    }).catch(e => console.error(e));
    return res;
  },

  accept: async (encounterId: string) => {
    const res = await apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/accept`, {
      method: "POST"
    }).then((r) => r.json());
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'encounter_updated', encounterId })
    }).catch(e => console.error(e));
    return res;
  },
    
  getClinicalData: async (encounterId: string) =>
    apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/clinical-data`, {
      method: "GET",
    }).then((r) => r.json()),

  finish: async (encounterId: string, data: { notes?: string; diagnosis?: string }) => {
    const res = await apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/finish`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json());
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'consultation_finished', encounterId })
    }).catch(e => console.error(e));
    return res;
  },

  prescribe: async (encounterId: string, data: { medication: string; instructions?: string }) =>
    apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/prescribe`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

/**
 * API endpoints for diagnostic reports.
 */
export const reportsAPI = {
  addReportForEncounter: async (encounterId: string, data: { name: string; conclusion?: string }) =>
    apiFetch(`${API_BASE_URL}/api/identity/encounters/${encounterId}/reports`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  addReportForPatient: async (patientId: string, data: { name: string; conclusion?: string }) =>
    apiFetch(`${API_BASE_URL}/api/identity/patients/${patientId}/reports`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

/**
 * API endpoints for intake service.
 */
export const intakeAPI = {
  getQuestions: async () =>
    apiFetch(`${API_BASE_URL}/api/intake/questions`, {
      method: "GET",
    }).then((r) => r.json()),

  startIntake: async (patientId: string, encounterId: string, hospitalId?: string) =>
    apiFetch(`${API_BASE_URL}/api/intake/start`, {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId, encounter_id: encounterId, hospital_id: hospitalId }),
    }).then((r) => r.json()),

  submitAnswer: async (sessionId: string, answer: string) =>
    apiFetch(`${API_BASE_URL}/api/intake/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }).then((r) => r.json()),

  getSummary: async (sessionId: string) =>
    apiFetch(`${API_BASE_URL}/api/intake/${sessionId}/summary`, {
      method: "GET",
    }).then((r) => r.json()),
};

/**
 * API endpoints for reminders service.
 */
export const remindersAPI = {
  scheduleReminder: async (data: Record<string, any>) =>
    apiFetch(`${API_BASE_URL}/api/reminders/schedule`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  scheduleFromPrescription: async (medicationRequestId: string) =>
    apiFetch(`${API_BASE_URL}/api/reminders/from-prescription`, {
      method: "POST",
      body: JSON.stringify({ medication_request_id: medicationRequestId }),
    }).then((r) => r.json()),

  getPatientReminders: async (patientId: string) =>
    apiFetch(`${API_BASE_URL}/api/reminders/patient/${patientId}`, {
      method: "GET",
    }).then((r) => r.json()),

  acknowledgeReminder: async (reminderId: string, status: string) =>
    apiFetch(`${API_BASE_URL}/api/reminders/${reminderId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }).then((r) => r.json()),
};

/**
 * API endpoints for prediction service.
 */
export const predictionAPI = {
  predictNextVisit: async (data: Record<string, any>) =>
    apiFetch(`${API_BASE_URL}/api/predictions/next-visit`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getDoctorPatterns: async (hospitalId: string, doctorId?: string) =>
    apiFetch(
      `${API_BASE_URL}/api/predictions/next-visit/hospital/${hospitalId}/patterns${doctorId ? "?doctor_id=" + doctorId : ""}`,
      {
        method: "GET",
      }
    ).then((r) => r.json()),
};