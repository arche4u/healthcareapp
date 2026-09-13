/**
 * Patient Detail Page
 * Fetches real FHIR data from identity-svc API.
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar, FileText, Pill, BarChart3, Stethoscope, Phone, Mail, MapPin, Heart, Syringe,
  ChevronLeft, Edit, Download, Bell, Loader2, AlertCircle, User, Plus, Mic, MicOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost";
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost/auth";

interface VitalsData {
  date: string;
  bp_systolic: number;
  bp_diastolic: number;
  glucose: number;
  weight: number;
  heartRate: number;
  spo2: number;
}

interface EncounterRecord {
  id: string;
  date: string;
  type: string;
  doctor: string;
  notes: string;
  status?: string;
}

interface MedicationRecord {
  id: string;
  date: string;
  medication: string;
  dosage: string;
  duration: string;
  status: string;
}

interface LabResult {
  id: string;
  date: string;
  test: string;
  result: string;
  notes: string;
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const patientId = params.id;

  const [patient, setPatient] = useState<any>(null);
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [diagnostic_reports, setDiagnosticReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Report Form State
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportConclusion, setNewReportConclusion] = useState("");
  const [addingReport, setAddingReport] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/signin");
      return;
    }

    fetchPatientData(token);
  }, [patientId, router]);

  const fetchPatientData = async (token: string) => {
    try {
      setLoading(true);

      // Get current user
      const userinfoRes = await fetch(`${AUTH_BASE}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userinfoRes.ok) {
        localStorage.removeItem("accessToken");
        router.push("/auth/signin");
        return;
      }

      const userinfo = await userinfoRes.json();
      setUser(userinfo);

      // Fetch patient bundle
      const bundleRes = await fetch(
        `${API_BASE}/api/identity/patients/${patientId}/bundle`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!bundleRes.ok) {
        if (bundleRes.status === 403) {
          setError("You don't have access to this patient's records");
        } else if (bundleRes.status === 404) {
          setError("Patient not found");
        } else {
          setError(`Failed to load patient data: ${bundleRes.status}`);
        }
        setLoading(false);
        return;
      }

      const bundle = await bundleRes.json();
      setPatient(bundle.patient);

      // Process encounters
      if (bundle.encounters && bundle.encounters.length > 0) {
        setEncounters(bundle.encounters.map((enc: any) => ({
          id: enc.id,
          date: enc.period?.start || new Date().toISOString().split('T')[0],
          type: enc.class?.text || "Outpatient Visit",
          doctor: enc.participant?.[0]?.individual?.display || "Dr. Rao",
          notes: enc.notes || "No additional notes",
          status: enc.status,
        })));
      }

      // Process medications
      if (bundle.medications && bundle.medications.length > 0) {
        setMedications(bundle.medications.map((med: any) => ({
          id: med.id,
          date: med.authoredOn?.split('T')[0] || new Date().toISOString().split('T')[0],
          medication: med.medicationCodeableConcept?.text || "Prescription",
          dosage: med.dosageInstruction?.[0]?.text || "As prescribed",
          duration: getDuration(med),
          status: med.status,
        })));
      }

      // Process observations (vitals)
      if (bundle.observations && bundle.observations.length > 0) {
        setObservations(bundle.observations);
      }

      // Process diagnostic reports
      if (bundle.diagnostic_reports && bundle.diagnostic_reports.length > 0) {
        setDiagnosticReports(bundle.diagnostic_reports);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setNewReportConclusion(prev => prev + (prev ? " " : "") + finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName || !newReportConclusion) return;

    setAddingReport(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/api/identity/patients/${patientId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newReportName,
          conclusion: newReportConclusion
        })
      });

      if (!res.ok) throw new Error("Failed to add report");

      const savedReport = await res.json();
      
      // Update state immediately for UX
      setDiagnosticReports(prev => [savedReport, ...(prev || [])]);
      
      // Reset form
      setNewReportName("");
      setNewReportConclusion("");
      setShowReportForm(false);
      
    } catch (err) {
      console.error(err);
      alert("Failed to add report. Please try again.");
    } finally {
      setAddingReport(false);
    }
  };

  const getDuration = (med: any): string => {
    const dispense = med.dispenseRequest;
    if (dispense?.validityPeriod) {
      return `${dispense.validityPeriod.duration} ${dispense.validityPeriod.durationUnit || "days"}`;
    }
    return "As directed";
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/auth/signin");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Patient</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Calculate vitals from observations
  const latestVitals = observations.length > 0 ? {
    bp: observations.find(o => o.code?.text?.includes("Blood pressure")) ||
        observations.find(o => o.code?.coding?.[0]?.code === "85354-9"),
    glucose: observations.find(o => o.code?.text?.includes("Glucose")) ||
        observations.find(o => o.code?.coding?.[0]?.code === "2345-7"),
    latest: observations[observations.length - 1],
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OneHealth
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Record
            </Button>
            <Button size="sm" onClick={() => window.location.reload()}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Record
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {patient ? (
          <>
            {/* Patient Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                  {(patient.name?.[0]?.given?.[0] || "P")[0]}
                  {(patient.name?.[0]?.family || "")[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
                  </h1>
                  <p className="text-muted-foreground">
                    {patient.gender === "male" ? "Male" : patient.gender === "female" ? "Female" : "Other"},
                    born {patient.birthDate || "Unknown"}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Active Record
                    </span>
                    {patient.abhaId && (
                      <span>ABHA ID: {patient.abhaId}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {patient.telecom?.map((contact: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center space-x-3 mb-3">
                    {contact.system === "phone" && <Phone className="h-5 w-5 text-primary" />}
                    {contact.system === "email" && <Mail className="h-5 w-5 text-primary" />}
                    {contact.system === "url" && <MapPin className="h-5 w-5 text-primary" />}
                    <h3 className="font-medium capitalize">{contact.system || "Contact"}</h3>
                  </div>
                  <p className="text-muted-foreground">{contact.value}</p>
                </div>
              ))}
              {patient.address?.map((addr: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center space-x-3 mb-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Address</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {[addr.line, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabs / Sections */}
            <div className="space-y-8">
              {/* Vitals Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <BarChart3 className="h-5 w-5 text-primary mr-2" />
                    Vitals & Observations
                  </h2>
                  <button className="text-sm text-primary hover:underline">
                    + Add Vitals
                  </button>
                </div>

                {observations.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {observations.map((obs, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-card border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          {obs.code?.text || obs.code?.coding?.[0]?.display || "Observation"}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">
                              {obs.valueQuantity?.value || obs.valueString || "N/A"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {obs.valueQuantity?.unit || ""}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {obs.effectiveDateTime ? new Date(obs.effectiveDateTime).toLocaleDateString() : "Recent"}
                          </p>
                          {obs.note && (
                            <p className="text-xs text-muted-foreground mt-2">{obs.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-card border border-dashed border-border text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No vitals recorded yet</p>
                    <Button className="mt-4" variant="outline">
                      Add Vitals
                    </Button>
                  </div>
                )}
              </section>

              {/* Encounters */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Stethoscope className="h-5 w-5 text-primary mr-2" />
                    Visit History
                  </h2>
                  <button className="text-sm text-primary hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {encounters.length > 0 ? (
                    encounters.map(enc => (
                      <Link href={`/encounters/${enc.id}`} key={enc.id}>
                        <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Calendar className="h-5 w-5 text-secondary" />
                              <div>
                                <p className="font-medium">{enc.type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {enc.doctor} • {enc.date}
                                </p>
                              </div>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 rounded-xl bg-card border border-dashed border-border text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No visits recorded</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Prescriptions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Pill className="h-5 w-5 text-primary mr-2" />
                    Active Prescriptions
                  </h2>
                  <Link href="/prescribe" className="text-sm text-primary hover:underline">
                    + New Prescription
                  </Link>
                </div>

                <div className="space-y-3">
                  {medications.length > 0 ? (
                    medications.map(med => (
                      <div key={med.id} className="p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Syringe className="h-5 w-5 text-secondary mt-0.5" />
                            <div>
                              <p className="font-medium">{med.medication}</p>
                              <p className="text-sm text-muted-foreground mt-1">{med.dosage}</p>
                              <p className="text-xs text-muted-foreground mt-1">Duration: {med.duration}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  med.status === "active" ? "bg-green-500/10 text-green-600" :
                                  med.status === "completed" ? "bg-blue-500/10 text-blue-600" :
                                  "bg-gray-500/10 text-gray-600"
                                }`}>
                                  {med.status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Prescribed: {med.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 rounded-xl bg-card border border-dashed border-border text-center">
                      <Pill className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No active prescriptions</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Diagnostic Reports */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <FileText className="h-5 w-5 text-orange-500 mr-2" />
                    Diagnostic Reports
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowReportForm(!showReportForm)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Report
                  </Button>
                </div>

                {showReportForm && (
                  <form onSubmit={handleAddReport} className="bg-orange-50/50 p-5 rounded-xl border border-orange-100 mb-6 space-y-4">
                    <h3 className="font-medium text-orange-800">New Diagnostic Report</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm">Report Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Complete Blood Count"
                          value={newReportName}
                          onChange={(e) => setNewReportName(e.target.value)}
                          className="w-full p-2 rounded-lg border bg-background"
                          required
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-sm">Conclusion / Findings</label>
                        <div className="relative">
                          <textarea
                            placeholder="e.g. Normal values across all parameters..."
                            value={newReportConclusion}
                            onChange={(e) => setNewReportConclusion(e.target.value)}
                            className="w-full p-2 pr-10 rounded-lg border bg-background resize-none h-20"
                            required
                          />
                          <button
                            type="button"
                            onClick={toggleListen}
                            className={`absolute right-2 bottom-2 p-2 rounded-full transition-colors ${
                              isListening 
                                ? "bg-red-100 text-red-600 animate-pulse" 
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title="Click to dictate"
                          >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                        </div>
                        {isListening && <p className="text-xs text-red-500 animate-pulse mt-1">Listening...</p>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setShowReportForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingReport} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {addingReport ? "Saving..." : "Save Report"}
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {!diagnostic_reports || diagnostic_reports.length === 0 ? (
                    <div className="text-center py-8 bg-card border rounded-xl border-dashed">
                      <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No reports added yet.</p>
                    </div>
                  ) : (
                    diagnostic_reports.map((rep: any) => (
                      <div key={rep.id} className="bg-card border p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="font-bold">{rep.code?.text || "Medical Report"}</h4>
                            <p className="text-sm text-muted-foreground">
                              {rep.conclusion || "No conclusion provided"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              Status: {rep.status}
                            </p>
                            {(rep.issued || rep.effectiveDateTime) && (
                              <p className="text-xs text-muted-foreground mt-1">Issued: {new Date(rep.issued || rep.effectiveDateTime).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Patient Not Found</h3>
            <p className="text-muted-foreground mb-4">No patient record found with ID: {patientId}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        )}
      </main>
    </div>
  );
}

// revalidate = 0 removed — this is a client component