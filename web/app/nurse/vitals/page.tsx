"use client";

import { useEffect, useState } from "react";
import { Search, Clipboard, HeartPulse, Thermometer, Droplets, Activity } from "lucide-react";
import { appointmentsAPI, authAPI, identityAPI } from "@/lib/api";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function NurseVitalsPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  // Check-in modal state
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Vitals modal state
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [vitalsForm, setVitalsForm] = useState({ hr: "", bp: "", temp: "", spO2: "" });
  const [vitalsLoading, setVitalsLoading] = useState(false);

  const searchForPatient = async () => {
    if (!searchQuery || !hospitalId) return;
    try {
      const res = await identityAPI.searchPatients({ hospital_id: hospitalId });
      const filtered = (res.patients || []).filter((p: any) => {
        const name = p.name?.[0]?.family || p.name?.[0]?.given?.join(" ") || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.abhaId && p.abhaId.toLowerCase().includes(searchQuery.toLowerCase()));
      });
      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckin = async (patientId: string) => {
    if (!hospitalId) return;
    setCheckinLoading(true);
    try {
      await appointmentsAPI.book(patientId, {
        hospital_id: hospitalId,
        period_start: new Date().toISOString(),
        reason: "Triage Check-in",
      });
      setIsCheckinOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      loadQueue(hospitalId);
    } catch (err) {
      console.error(err);
      alert("Failed to check-in patient");
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;
    setVitalsLoading(true);
    try {
      await appointmentsAPI.triage(selectedEncounter.id, {
        heartRate: vitalsForm.hr,
        bloodPressure: vitalsForm.bp,
        temperature: vitalsForm.temp,
        spO2: vitalsForm.spO2
      });
      setIsVitalsOpen(false);
      if (hospitalId) loadQueue(hospitalId);
    } catch (err) {
      console.error(err);
      alert("Failed to save vitals");
    } finally {
      setVitalsLoading(false);
    }
  };

  const loadQueue = async (hId: string) => {
    try {
      // Get all "arrived" patients that need vitals or have recently had them taken
      const res = await appointmentsAPI.listForHospital(hId, "arrived");
      if (res.encounters) {
        // Fetch patient details for each encounter
        const enriched = await Promise.all(
          res.encounters.map(async (enc: any) => {
            const pRes = await identityAPI.getPatientBundle(enc.subject?.reference?.replace("Patient/", "") || "");
            return { ...enc, patient: pRes.patient };
          })
        );
        setQueue(enriched);
      }
    } catch (err) {
      console.error("Failed to load triage queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const user = await authAPI.userinfo();
        if (user.hospital_id) {
          setHospitalId(user.hospital_id);
          loadQueue(user.hospital_id);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    init();
  }, []);

  // Real-time SSE Listener
  useEffect(() => {
    if (!hospitalId) return;
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'patient_matched' || data.type === 'triage_updated') {
          // Instantly refresh queue if someone checks in or vitals are updated
          loadQueue(hospitalId);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };
    return () => eventSource.close();
  }, [hospitalId]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vitals Dashboard</h1>
          <p className="text-muted-foreground text-sm">Real-time view of patient vitals in the triage queue</p>
        </div>
        <button
          onClick={() => setIsCheckinOpen(true)}
          className="whitespace-nowrap px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium shadow-sm transition-all"
        >
          + Check-in Patient
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center p-12 bg-card border rounded-xl">
          <Clipboard className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No patients currently in the triage queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map((encounter) => {
            const patient = encounter.patient;
            const name = patient?.name?.[0];
            const fullName = name ? `${name.given?.join(" ") || ""} ${name.family || ""}`.trim() : "Unknown";

            // Extract latest vitals if they exist in the encounter extension or observations
            // For UI purposes, if not present, we show "Pending"
            const vitalsTaken = false;

            return (
              <div key={encounter.id} className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{fullName}</h3>
                    <p className="text-sm text-muted-foreground">ID: {patient?.id?.substring(0, 8)}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${vitalsTaken ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {vitalsTaken ? "Taken" : "Pending Vitals"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                    <HeartPulse className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="font-medium">-- bpm</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Pressure</p>
                      <p className="font-medium">--/--</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                    <Thermometer className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Temp</p>
                      <p className="font-medium">-- °C</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-teal-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">SpO2</p>
                      <p className="font-medium">-- %</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedEncounter(encounter);
                      setVitalsForm({ hr: "", bp: "", temp: "", spO2: "" });
                      setIsVitalsOpen(true);
                    }}
                    className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg text-sm transition-colors"
                  >
                    Enter Vitals
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isCheckinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-2xl shadow-xl border p-6 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Check-in Patient to Triage</h3>
                <button onClick={() => setIsCheckinOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search registered patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchForPatient()}
                  className="flex-1 p-2 rounded-md border bg-background"
                />
                <button onClick={searchForPatient} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium">
                  Search
                </button>
              </div>

              <div className="overflow-y-auto flex-1 border rounded-lg bg-muted/10 p-2 space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground p-4">No results found. Try searching.</p>
                ) : (
                  searchResults.map(p => {
                    const name = p.name?.[0];
                    const fullName = name ? `${name.given?.join(" ") || ""} ${name.family || ""}`.trim() : "Unknown";
                    return (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-card border rounded-lg">
                        <div>
                          <p className="font-medium">{fullName}</p>
                          <p className="text-xs text-muted-foreground">ID: {p.id.substring(0, 8)}</p>
                        </div>
                        <button
                          onClick={() => handleCheckin(p.id)}
                          disabled={checkinLoading}
                          className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                        >
                          Check-in
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVitalsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl border p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Enter Vitals</h3>
                <button onClick={() => setIsVitalsOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveVitals} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Heart Rate (bpm)</label>
                    <input type="number" required value={vitalsForm.hr} onChange={e => setVitalsForm({ ...vitalsForm, hr: e.target.value })} className="w-full p-2 rounded-md border bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Blood Pressure</label>
                    <input type="text" placeholder="120/80" required value={vitalsForm.bp} onChange={e => setVitalsForm({ ...vitalsForm, bp: e.target.value })} className="w-full p-2 rounded-md border bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                    <input type="number" step="0.1" required value={vitalsForm.temp} onChange={e => setVitalsForm({ ...vitalsForm, temp: e.target.value })} className="w-full p-2 rounded-md border bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SpO2 (%)</label>
                    <input type="number" required value={vitalsForm.spO2} onChange={e => setVitalsForm({ ...vitalsForm, spO2: e.target.value })} className="w-full p-2 rounded-md border bg-background" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={vitalsLoading} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                    {vitalsLoading ? "Saving..." : "Save Vitals"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
