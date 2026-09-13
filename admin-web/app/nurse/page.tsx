"use client";

import { useEffect, useState } from "react";
import { Users, Activity, CheckCircle, Clock, Camera, Stethoscope, ChevronRight, UserCheck } from "lucide-react";
import { appointmentsAPI, authAPI, identityAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { FaceScanner } from "@/components/biometrics/FaceScanner";

type Doctor = {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  practitioner_id: string | null;
  active_patients: number;
};

export default function NurseDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [completedQueue, setCompletedQueue] = useState<any[]>([]);
  const [triagedCount, setTriagedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  // Modal state
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFaceScanOpen, setIsFaceScanOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Doctor selection step (shown after vitals)
  const [isDoctorSelectionOpen, setIsDoctorSelectionOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [assignedEncounterId, setAssignedEncounterId] = useState<string | null>(null);
  const [assigningDoctor, setAssigningDoctor] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Form state
  const [vitals, setVitals] = useState({
    bp: "",
    hr: "",
    temp: "",
    weight: "",
    chief_complaint: "",
  });

  const loadQueue = async (hId?: string) => {
    try {
      const targetHospitalId = hId || hospitalId;
      if (!targetHospitalId) return;

      const response = await appointmentsAPI.listForHospital(targetHospitalId);
      const allEncounters = response.encounters || [];
      
      const waiting = allEncounters.filter(
        (e: any) => e.status === "planned" || e.status === "arrived"
      );
      setQueue(waiting);
      
      const completed = allEncounters.filter(
        (e: any) => e.status === "finished" || e.status === "triaged"
      );
      setCompletedQueue(completed);

      const triaged = allEncounters.filter((e: any) => e.status === "triaged" || e.status === "finished");
      setTriagedCount(triaged.length);
    } catch (err) {
      console.error("Failed to load queue", err);
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

  const openTriageModal = (encounter: any) => {
    setSelectedEncounter(encounter);
    setVitals({ bp: "", hr: "", temp: "", weight: "", chief_complaint: "" });
    setIsModalOpen(true);
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;

    setSubmitting(true);
    try {
      const data = Object.fromEntries(
        Object.entries(vitals).filter(([_, v]) => v.trim() !== "")
      );
      
      await appointmentsAPI.triage(selectedEncounter.id, data);
      setIsModalOpen(false);
      loadQueue();

      // Open doctor selection modal after successful vitals
      setAssignedEncounterId(selectedEncounter.id);
      await loadDoctors();
      setIsDoctorSelectionOpen(true);
    } catch (err) {
      console.error("Triage failed", err);
      alert("Failed to submit triage data.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadDoctors = async () => {
    if (!hospitalId) return;
    setLoadingDoctors(true);
    try {
      const res = await identityAPI.getDoctorsWorkload(hospitalId);
      setDoctors(res.doctors || []);
      setSelectedDepartment("all");
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleAssignDoctor = async (doctorId: string) => {
    if (!assignedEncounterId) return;
    setAssigningDoctor(true);
    try {
      await identityAPI.assignDoctor(assignedEncounterId, doctorId);
      setIsDoctorSelectionOpen(false);
      setAssignedEncounterId(null);
      loadQueue();
    } catch (err) {
      console.error("Failed to assign doctor", err);
      alert("Failed to assign doctor. Please try again.");
    } finally {
      setAssigningDoctor(false);
    }
  };

  const handleFaceScanComplete = async (imageBase64: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/identity/match-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ image: imageBase64 })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Matched patient: ${formatName(data.name)} (Distance: ${data.distance.toFixed(2)})`);
        
        if (hospitalId && data.patient_id) {
          try {
            const encounter = await appointmentsAPI.book(data.patient_id, {
              hospital_id: hospitalId,
              period_start: new Date().toISOString(),
              reason: "Walk-in via Face Scan",
            });
            
            const encounterForTriage = {
              ...encounter,
              patient: {
                id: data.patient_id,
                name: data.name
              }
            };
            
            setIsFaceScanOpen(false);
            await loadQueue();
            openTriageModal(encounterForTriage);
          } catch (bookErr) {
            console.error("Failed to auto-book encounter", bookErr);
            alert("Patient matched, but failed to auto-create encounter.");
            setIsFaceScanOpen(false);
            loadQueue();
          }
        } else {
          setIsFaceScanOpen(false);
          loadQueue();
        }
      } else {
        alert(`Match failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to Identity Service.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatName = (nameObj: any) => {
    if (Array.isArray(nameObj) && nameObj.length > 0) {
      return `${nameObj[0].given?.join(" ") || ""} ${nameObj[0].family || ""}`.trim();
    }
    return "Unknown";
  };

  const formatPatientName = (patient: any) => {
    if (!patient || !patient.name || patient.name.length === 0) return "Unknown Patient";
    const name = patient.name[0];
    return `${name.given?.join(" ") || ""} ${name.family || ""}`.trim();
  };

  // Get unique departments/specialties from doctors
  const departments = ["all", ...Array.from(new Set(doctors.map((d) => d.specialty || "General")))];
  
  // Filter by department and sort by availability (least active patients first)
  const filteredDoctors = (selectedDepartment === "all"
    ? doctors
    : doctors.filter((d) => (d.specialty || "General") === selectedDepartment)
  ).sort((a, b) => a.active_patients - b.active_patients);

  const getWorkloadColor = (count: number) => {
    if (count === 0) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (count <= 2) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Triage Queue</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage patients waiting for intake</p>
        </div>
        <Button onClick={() => setIsFaceScanOpen(true)} className="bg-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
          <Camera className="w-4 h-4" />
          Face Scan Check-in
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Waiting Patients</span>
          </div>
          <div className="text-2xl font-bold">{queue.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Queue Status</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">
            {queue.length > 5 ? "Busy" : "Normal"}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Triaged Today</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{triagedCount}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>The queue is currently empty.</p>
          </div>
        ) : (
          <div className="divide-y">
            {queue.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">
                    {formatPatientName(item.patient)}
                  </h3>
                  <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                    <span>ID: {item.id?.substring(0, 8)}</span>
                    <span>•</span>
                    <span>Status: <span className="capitalize">{item.status}</span></span>
                    {item.reasonCode && item.reasonCode[0] && (
                      <>
                        <span>•</span>
                        <span>Reason: {item.reasonCode[0].text}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button onClick={() => openTriageModal(item)}>Triage Patient</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Completed Consultations &amp; Triages</h2>
        <div className="bg-card rounded-xl border overflow-hidden">
          {completedQueue.length === 0 ? (
             <div className="text-center p-12 text-muted-foreground">
               <p>No completed records yet.</p>
             </div>
          ) : (
            <div className="divide-y">
              {completedQueue.map((item, idx) => (
                <div key={item.id || idx} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between opacity-80">
                  <div>
                    <h3 className="font-medium text-lg">
                      {formatPatientName(item.patient)}
                    </h3>
                    <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                      <span>ID: {item.id?.substring(0, 8)}</span>
                      <span>•</span>
                      <span>Status: <span className="capitalize font-semibold">{item.status}</span></span>
                      {item.reasonCode && item.reasonCode[0] && (
                        <>
                          <span>•</span>
                          <span>Reason: {item.reasonCode[0].text}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Triage Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEncounter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border shadow-xl rounded-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Patient Triage</h2>
                <p className="text-sm text-muted-foreground">
                  {formatPatientName(selectedEncounter.patient)}
                </p>
              </div>

              <form onSubmit={handleTriageSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={vitals.bp}
                      onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                      className="w-full p-2 rounded-md border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="72"
                      value={vitals.hr}
                      onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                      className="w-full p-2 rounded-md border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={vitals.temp}
                      onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                      className="w-full p-2 rounded-md border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={vitals.weight}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      className="w-full p-2 rounded-md border bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Chief Complaint</label>
                  <textarea
                    placeholder="Brief description of patient's current symptoms..."
                    value={vitals.chief_complaint}
                    onChange={(e) => setVitals({ ...vitals, chief_complaint: e.target.value })}
                    className="w-full p-3 rounded-md border bg-background min-h-[100px]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Save Vitals & Assign Doctor →"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doctor Selection Modal */}
      <AnimatePresence>
        {isDoctorSelectionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border shadow-xl rounded-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Assign Doctor</h2>
                  <p className="text-sm text-muted-foreground">Vitals recorded. Select an available doctor for this patient.</p>
                </div>
              </div>

              <div className="p-6">
                {/* Department Filter */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartment(dept)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedDepartment === dept
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {dept === "all" ? "All Departments" : dept}
                    </button>
                  ))}
                </div>

                {loadingDoctors ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No doctors available in this department.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredDoctors.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleAssignDoctor(doc.id)}
                        disabled={assigningDoctor}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {doc.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{doc.full_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.specialty || "General"}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getWorkloadColor(doc.active_patients)}`}>
                          <UserCheck className="h-3 w-3" />
                          {doc.active_patients} patient{doc.active_patients !== 1 ? "s" : ""}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> 0 patients &nbsp;
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> 1–2 patients &nbsp;
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> 3+ patients
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsDoctorSelectionOpen(false)}>
                    Skip for Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFaceScanOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-2xl shadow-xl border overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold text-lg">Biometric Check-in</h3>
                <button
                  onClick={() => setIsFaceScanOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <FaceScanner onScanComplete={handleFaceScanComplete} isLoading={submitting} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}