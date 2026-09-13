"""FHIR Client - stub for communicating with hospital HIS/EMR adapters."""
import os
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


@dataclass
class HospitalAdapterConfig:
    """Configuration for a hospital's HIS/EMR adapter."""
    hospital_id: str
    base_url: str
    auth_type: str = "bearer"  # bearer, basic, api_key
    credentials: Dict[str, str] = None
    timeout: int = 30

    def __post_init__(self):
        if self.credentials is None:
            self.credentials = {}


class BaseFHIRClient(ABC):
    """Abstract base for FHIR clients (hospital adapters)."""

    @abstractmethod
    def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def search_patients(self, **params) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_encounters(self, patient_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_observations(self, patient_id: str, category: str = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_medication_requests(self, patient_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_diagnostic_reports(self, patient_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def create_encounter(self, encounter: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_observation(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_medication_request(self, med_request: Dict[str, Any]) -> Dict[str, Any]:
        pass


class FHIRClient(BaseFHIRClient):
    """
    FHIR Client for communicating with hospital adapters.

    This is a stub implementation. In production, each hospital would have
    a custom adapter implementing this interface. The adapter normalizes
    the hospital's proprietary API to FHIR R4 resources.
    """

    def __init__(self, config: HospitalAdapterConfig):
        self.config = config
        self.base_url = config.base_url.rstrip("/")
        self.timeout = config.timeout

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/fhir+json",
            "Content-Type": "application/fhir+json",
        }
        if self.config.auth_type == "bearer":
            token = self.config.credentials.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
        elif self.config.auth_type == "basic":
            import base64
            user = self.config.credentials.get("username", "")
            pwd = self.config.credentials.get("password", "")
            creds = base64.b64encode(f"{user}:{pwd}".encode()).decode()
            headers["Authorization"] = f"Basic {creds}"
        elif self.config.auth_type == "api_key":
            key = self.config.credentials.get("api_key")
            if key:
                headers["X-API-Key"] = key
        return headers

    def _request(self, method: str, path: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Make HTTP request to hospital adapter."""
        # STUB: In real implementation, use httpx or requests
        logger.warning(f"FHIRClient._request({method} {path}) - STUB, returning None")
        return None

    def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        return self._request("GET", f"/Patient/{patient_id}")

    def search_patients(self, **params) -> List[Dict[str, Any]]:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        result = self._request("GET", f"/Patient?{query}")
        if result and result.get("entry"):
            return [e["resource"] for e in result["entry"]]
        return []

    def get_encounters(self, patient_id: str) -> List[Dict[str, Any]]:
        result = self._request("GET", f"/Encounter?patient={patient_id}")
        if result and result.get("entry"):
            return [e["resource"] for e in result["entry"]]
        return []

    def get_observations(self, patient_id: str, category: str = None) -> List[Dict[str, Any]]:
        params = [f"patient={patient_id}"]
        if category:
            params.append(f"category={category}")
        query = "&".join(params)
        result = self._request("GET", f"/Observation?{query}")
        if result and result.get("entry"):
            return [e["resource"] for e in result["entry"]]
        return []

    def get_medication_requests(self, patient_id: str) -> List[Dict[str, Any]]:
        result = self._request("GET", f"/MedicationRequest?patient={patient_id}")
        if result and result.get("entry"):
            return [e["resource"] for e in result["entry"]]
        return []

    def get_diagnostic_reports(self, patient_id: str) -> List[Dict[str, Any]]:
        result = self._request("GET", f"/DiagnosticReport?patient={patient_id}")
        if result and result.get("entry"):
            return [e["resource"] for e in result["entry"]]
        return []

    def create_encounter(self, encounter: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", "/Encounter", json=encounter) or {}

    def create_observation(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", "/Observation", json=observation) or {}

    def create_medication_request(self, med_request: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", "/MedicationRequest", json=med_request) or {}


class FHIRClientRegistry:
    """Registry of FHIR clients per hospital."""

    def __init__(self):
        self._clients: Dict[str, FHIRClient] = {}

    def register(self, config: HospitalAdapterConfig) -> FHIRClient:
        client = FHIRClient(config)
        self._clients[config.hospital_id] = client
        return client

    def get(self, hospital_id: str) -> Optional[FHIRClient]:
        return self._clients.get(hospital_id)

    def get_all(self) -> List[FHIRClient]:
        return list(self._clients.values())


# Global registry instance
registry = FHIRClientRegistry()


def get_fhir_client(hospital_id: str) -> Optional[FHIRClient]:
    """Get FHIR client for a specific hospital."""
    return registry.get(hospital_id)


def register_hospital_adapter(config: HospitalAdapterConfig) -> FHIRClient:
    """Register a new hospital adapter."""
    return registry.register(config)