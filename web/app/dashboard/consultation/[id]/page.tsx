"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Activity, FileText, Pill, Plus, CheckCircle, Brain, History, User, Mic, MicOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { appointmentsAPI, reportsAPI } from "@/lib/api";
import { HealthScoreCard } from "@/components/patient/HealthScoreCard";

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const encounterId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Doctor inputs
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Prescription state
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedInstr, setNewMedInstr] = useState("");
  const [prescribing, setPrescribing] = useState(false);

  // Diagnostic Report state
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportConclusion, setNewReportConclusion] = useState("");
  const [addingReport, setAddingReport] = useState(false);

  const [finishing, setFinishing] = useState(false);

  // AI Assistant state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");

  // Voice-to-Prescription state
  const [voicePrescribing, setVoicePrescribing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await appointmentsAPI.getClinicalData(encounterId);
      setData(result);
    } catch (err) {
      console.error("Failed to load clinical data", err);
      alert("Failed to load consultation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [encounterId]);

  const toggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      // Since it's continuous, we don't want to overwrite the entire notes, 
      // but in a simple implementation we just append at the end of the current notes state when the result is final.
      if (event.results[event.results.length - 1].isFinal) {
        setNotes((prev) => prev + (prev ? " " : "") + currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;
    
    setPrescribing(true);
    try {
      await appointmentsAPI.prescribe(encounterId, {
        medication: newMedName,
        instructions: newMedInstr
      });
      // Fire real-time SSE event so patient portal updates immediately
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'medication_prescribed', encounterId })
      }).catch(console.error);
      setNewMedName("");
      setNewMedInstr("");
      setShowPrescriptionForm(false);
      loadData(); // refresh to show new med
    } catch (err) {
      console.error(err);
      alert("Failed to prescribe.");
    } finally {
      setPrescribing(false);
    }
  };

  const handleVoicePrescribe = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported. Please use Chrome or Edge.");
      return;
    }

    setVoicePrescribing(true);
    setVoiceTranscript("");

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      try {
        const res = await fetch('/api/ai/voice-prescribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        });
        const result = await res.json();
        if (res.ok && result.medication) {
          setNewMedName(result.medication);
          setNewMedInstr(result.instructions || "");
          setShowPrescriptionForm(true);
        } else {
          alert(`Could not parse prescription: ${result.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to process voice prescription.");
      } finally {
        setVoicePrescribing(false);
        setVoiceTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Voice recognition error:", event.error);
      alert(`Microphone error: ${event.error}`);
      setVoicePrescribing(false);
    };

    recognition.onend = () => {
      if (voicePrescribing) setVoicePrescribing(false);
    };

    recognition.start();
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName) return;
    
    setAddingReport(true);
    try {
      await reportsAPI.addReportForEncounter(encounterId, {
        name: newReportName,
        conclusion: newReportConclusion
      });
      setNewReportName("");
      setNewReportConclusion("");
      setShowReportForm(false);
      loadData(); // refresh to show new report
    } catch (err) {
      console.error(err);
      alert("Failed to add report.");
    } finally {
      setAddingReport(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await appointmentsAPI.finish(encounterId, {
        notes,
        diagnosis
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to finish consultation.");
      setFinishing(false);
    }
  };

  const generateAiInsights = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiInsights("");
    try {
      const getVital = (code: string) => {
        const obs = data.observations.find((o: any) => o.code?.text?.toLowerCase().includes(code.toLowerCase()));
        return obs ? obs.valueString : "--";
      };

      const vitals = {
        bp: getVital("Blood Pressure"),
        hr: getVital("Heart Rate"),
        temp: getVital("Temperature"),
        weight: getVital("Weight")
      };
      
      const patientInfo = {
        age: data.patient.birthDate ? Math.floor((new Date().getTime() - new Date(data.patient.birthDate).getTime()) / 31557600000) : null,
        gender: data.patient.gender
      };
      
      const symptoms = data.encounter.reasonCode?.[0]?.text || "";
      
      let historyText = "";
      if (data.history && data.history.length > 0) {
        historyText = data.history.map((past: any) => {
           const diags = past.encounter.diagnosis?.map((d:any)=>d.condition?.display).filter(Boolean).join(', ') || "";
           return `- ${past.hospital_name}: ${diags}`;
        }).join("\\n");
      }

      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals, symptoms, history: historyText, patientInfo })
      });
      
      if (!res.ok) throw new Error("Failed");
      const resultData = await res.json();
      setAiInsights(resultData.result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate AI insights.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const { encounter, patient, observations, medications, diagnostic_reports, intake } = data;
  
  const formatName = (nameObj: any[]) => {
    if (!nameObj || nameObj.length === 0) return "Unknown";
    return `${nameObj[0].given?.join(" ") || ""} ${nameObj[0].family || ""}`.trim();
  };

  const getVital = (code: string) => {
    const obs = observations.find((o: any) => o.code?.text?.toLowerCase().includes(code.toLowerCase()));
    return obs ? obs.valueString : "--";
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-muted/10">
      {/* Header */}
      <header className="border-b bg-card h-16 shrink-0 flex items-center px-6">
        <Link href="/dashboard" className="mr-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-3">
            Consultation: {formatName(patient.name)}
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
              Active Session
            </span>
          </h1>
        </div>
        <div>
          <Button onClick={handleFinish} disabled={finishing} className="gap-2">
            <CheckCircle className="w-4 h-4" />
            {finishing ? "Finishing..." : "Finish Consultation"}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row">
          
          {/* Left Panel: Clinical Context */}
          <div className="w-full lg:w-1/3 border-r bg-card h-full overflow-y-auto p-6 space-y-6">
            
            {/* Patient Demographics */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Info
              </h2>
              <div className="bg-muted/30 p-4 rounded-xl border">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Gender</div>
                  <div className="capitalize font-medium">{patient.gender || "Unknown"}</div>
                  
                  <div className="text-muted-foreground">Age</div>
                  <div className="font-medium">
                    {patient.birthDate ? 
                      Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / 31557600000) 
                      : "Unknown"} yrs
                  </div>
                  
                  <div className="text-muted-foreground">ABHA ID</div>
                  <div className="font-medium">{patient.abhaId || "Not Linked"}</div>
                </div>
              </div>
              {/* Compact Health Score from real vitals */}
              <div className="mt-3">
                <HealthScoreCard
                  observations={observations}
                  medications={medications}
                  encounters={data.history?.map((h: any) => h.encounter) || []}
                  compact
                />
              </div>
            </section>

            {/* Nurse Triage Vitals */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Triage Vitals
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <div className="text-xs text-red-600 font-medium mb-1">Blood Pressure</div>
                  <div className="text-lg font-bold text-red-700">{getVital("Blood Pressure")}</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                  <div className="text-xs text-orange-600 font-medium mb-1">Heart Rate</div>
                  <div className="text-lg font-bold text-orange-700">{getVital("Heart Rate")} <span className="text-sm font-normal">bpm</span></div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                  <div className="text-xs text-blue-600 font-medium mb-1">Temperature</div>
                  <div className="text-lg font-bold text-blue-700">{getVital("Temperature")} <span className="text-sm font-normal">°F</span></div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                  <div className="text-xs text-green-600 font-medium mb-1">Weight</div>
                  <div className="text-lg font-bold text-green-700">{getVital("Weight")} <span className="text-sm font-normal">kg</span></div>
                </div>
              </div>
              
              <div className="mt-3 bg-muted/50 p-3 rounded-lg border text-sm">
                <span className="font-medium">Chief Complaint:</span> {encounter.reasonCode?.[0]?.text || "None recorded"}
              </div>
            </section>

            {/* AI Intake Summary (If available) */}
            {intake && intake.responses && intake.responses.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Intake Summary
                </h2>
                <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl space-y-3">
                  {intake.summary && intake.summary.red_flags && intake.summary.red_flags.length > 0 && (
                    <div className="bg-red-500/10 text-red-600 p-2 rounded text-sm font-medium border border-red-500/20">
                      ⚠️ Red Flags: {intake.summary.red_flags.join(", ")}
                    </div>
                  )}
                  <div className="text-sm space-y-2">
                    {intake.responses.map((resp: any, i: number) => (
                      <div key={i} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <div className="font-medium text-muted-foreground">{resp.question_text}</div>
                        <div className="mt-0.5">{resp.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Cross-Hospital History */}
            {data.history && data.history.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Past Clinical History
                </h2>
                <div className="space-y-4">
                  {data.history.map((past: any, idx: number) => (
                    <div key={idx} className="bg-card border p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-semibold text-primary">{past.hospital_name}</div>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {past.encounter.period?.start ? new Date(past.encounter.period.start).toLocaleDateString() : "Unknown date"}
                        </div>
                      </div>
                      
                      {past.encounter.diagnosis && past.encounter.diagnosis.length > 0 && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Diagnosis:</span>{" "}
                          {past.encounter.diagnosis.map((d:any)=>d.condition?.display).filter(Boolean).join(', ')}
                        </div>
                      )}
                      
                      {past.medications && past.medications.length > 0 && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Prescribed:</span>{" "}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {past.medications.map((m:any, i:number) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex flex-col items-start gap-1">
                                <span>{m.medicationCodeableConcept?.text || "Medication"}</span>
                                {m.authoredOn && <span className="text-[10px] opacity-70 border-t border-blue-200 pt-0.5 w-full">{new Date(m.authoredOn).toLocaleDateString()}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {past.encounter.notes && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded italic">
                          "{past.encounter.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Panel: Doctor Input */}
          <div className="w-full lg:w-2/3 h-full overflow-y-auto p-6 space-y-8 bg-background">
            
            {/* AI Assistant Section */}
            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <Brain className="w-5 h-5" />
                  AI Clinical Assistant
                </h2>
                <Button 
                  onClick={generateAiInsights} 
                  disabled={aiLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {aiLoading ? "Analyzing..." : "Generate AI Insights"}
                </Button>
              </div>

              {aiInsights && (
                <div className="bg-white dark:bg-card border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl prose prose-sm dark:prose-invert max-w-none text-sm">
                  <div dangerouslySetInnerHTML={{ __html: aiInsights.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                </div>
              )}
            </section>

            {/* Clinical Notes */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Clinical Notes
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Diagnosis / Condition</label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Bronchitis, Type 2 Diabetes"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-3 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-muted-foreground">Detailed Notes</label>
                    <Button 
                      variant={isListening ? "destructive" : "outline"} 
                      size="sm" 
                      onClick={toggleListen}
                      className="gap-2 h-8"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isListening ? "Stop Recording" : "Dictate (Speech-to-Text)"}
                    </Button>
                  </div>
                  <textarea
                    placeholder="Subjective, Objective, Assessment, Plan (SOAP)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-48 p-4 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Prescriptions */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Prescriptions
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 transition-all ${
                      voicePrescribing
                        ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                        : ""
                    }`}
                    onClick={handleVoicePrescribe}
                    disabled={voicePrescribing}
                    title="Speak prescription to auto-fill the form"
                  >
                    <Mic className="w-4 h-4" />
                    {voicePrescribing ? "Listening..." : "Voice Rx"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Medication
                  </Button>
                </div>
              </div>
              {voiceTranscript && (
                <div className="mb-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
                  <span className="font-medium">Heard:</span> "{voiceTranscript}"
                </div>
              )}

              {showPrescriptionForm && (
                <form onSubmit={handlePrescribe} className="bg-muted/30 p-5 rounded-xl border mb-6 space-y-4">
                  <h3 className="font-medium">New Prescription</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm">Medication Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin 500mg"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        className="w-full p-2 rounded-lg border bg-background"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Dosage Instructions</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 tablet twice daily for 5 days"
                        value={newMedInstr}
                        onChange={(e) => setNewMedInstr(e.target.value)}
                        className="w-full p-2 rounded-lg border bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setShowPrescriptionForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={prescribing}>
                      {prescribing ? "Saving..." : "Prescribe"}
                    </Button>
                  </div>
                </form>
              )}

              {medications.length === 0 ? (
                <div className="text-center py-8 bg-card border rounded-xl border-dashed">
                  <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No medications prescribed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medications.map((med: any) => (
                    <div key={med.id} className="bg-card border p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Pill className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold">{med.medicationCodeableConcept?.text}</h4>
                          <p className="text-sm text-muted-foreground">
                            {med.dosageInstruction?.[0]?.text || "No instructions provided"}
                          </p>
                          {med.authoredOn && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Prescribed: {new Date(med.authoredOn).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <hr className="border-border" />

            {/* Diagnostic Reports */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
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
                    <div className="space-y-2">
                      <label className="text-sm">Conclusion / Findings</label>
                      <textarea
                        placeholder="e.g. Normal values across all parameters..."
                        value={newReportConclusion}
                        onChange={(e) => setNewReportConclusion(e.target.value)}
                        className="w-full p-2 rounded-lg border bg-background resize-none h-10"
                      />
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

              {!diagnostic_reports || diagnostic_reports.length === 0 ? (
                <div className="text-center py-8 bg-card border rounded-xl border-dashed">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No reports added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagnostic_reports.map((rep: any) => (
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
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded capitalize">
                        {rep.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
