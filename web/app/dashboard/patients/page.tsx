"use client";

import { useEffect, useState } from "react";
import { Search, UserCircle, Phone, Calendar, X, Activity, FileText, Mic, MicOff } from "lucide-react";
import { identityAPI, authAPI, reportsAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientBundle, setPatientBundle] = useState<any>(null);
  const [loadingBundle, setLoadingBundle] = useState(false);

  // Diagnostic Report Form State
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportConclusion, setReportConclusion] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    async function loadPatients() {
      try {
        const user = await authAPI.userinfo();
        if (user.hospital_id) {
          const res = await identityAPI.searchPatients({ hospital_id: user.hospital_id });
          if (res.patients) {
            setPatients(res.patients);
          }
        }
      } catch (err) {
        console.error("Failed to load patients", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const name = p.name?.[0]?.family || p.name?.[0]?.given?.join(" ") || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (p.abhaId && p.abhaId.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const openPatientModal = async (patient: any) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
    setLoadingBundle(true);
    try {
      const bundle = await identityAPI.getPatientBundle(patient.id);
      setPatientBundle(bundle);
    } catch (err) {
      console.error("Failed to load patient bundle", err);
    } finally {
      setLoadingBundle(false);
    }
  };

  const submitReport = async () => {
    if (!reportName.trim()) {
      alert("Report name is required");
      return;
    }
    setReportSubmitting(true);
    try {
      await reportsAPI.addReportForPatient(selectedPatient.id, {
        name: reportName,
        conclusion: reportConclusion,
      });
      setIsAddingReport(false);
      setReportName("");
      setReportConclusion("");
      // Refresh bundle to show new report
      openPatientModal(selectedPatient);
    } catch (err) {
      console.error(err);
      alert("Failed to add report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser.");
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
        setReportConclusion(prev => prev + (prev ? " " : "") + finalTranscript.trim());
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patient Directory</h1>
          <p className="text-muted-foreground text-sm">View all registered patients at your hospital</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name or ABHA ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg bg-card/50">
          <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-medium">No patients found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "Try adjusting your search criteria" : "No patients are registered at this hospital yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const name = patient.name?.[0]?.family || patient.name?.[0]?.given?.join(" ") || "Unknown";
            const telecom = patient.telecom?.[0]?.value || "No contact";
            return (
              <div 
                key={patient.id} 
                className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
                onClick={() => openPatientModal(patient)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {patient.gender || "Unknown"} • {patient.birthDate || "No DOB"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{telecom}</span>
                  </div>
                  {patient.abhaId && (
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span>ABHA: {patient.abhaId}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl border flex flex-col"
            >
              <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
                <div>
                  <h3 className="font-bold text-xl">
                    {selectedPatient.name?.[0]?.given?.join(" ")} {selectedPatient.name?.[0]?.family}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedPatient.id} • ABHA: {selectedPatient.abhaId || "None"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
                {loadingBundle ? (
                  <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Encounters */}
                    <div>
                      <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Past Consultations & Encounters
                      </h4>
                      {patientBundle?.encounters && patientBundle.encounters.length > 0 ? (
                        <div className="grid gap-3">
                          {patientBundle.encounters.map((enc: any, i: number) => (
                            <div key={i} className="bg-card border rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <p className="font-semibold">{enc.period?.start ? format(new Date(enc.period.start), "MMM d, yyyy h:mm a") : "Unknown Date"}</p>
                                <p className="text-sm text-muted-foreground">{enc.reasonCode?.[0]?.text || enc.type?.[0]?.text || "General Visit"}</p>
                              </div>
                              <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium capitalize border">{enc.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm p-4 border border-dashed rounded-lg text-center bg-card">No encounters found.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Medications */}
                      <div>
                        <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                          <Activity className="w-5 h-5 text-green-500" />
                          Medications
                        </h4>
                        {patientBundle?.medications && patientBundle.medications.length > 0 ? (
                          <div className="grid gap-3">
                            {patientBundle.medications.map((med: any, i: number) => (
                              <div key={i} className="bg-card border rounded-lg p-4">
                                <p className="font-semibold text-green-700">{med.medicationCodeableConcept?.text}</p>
                                <p className="text-sm text-muted-foreground mt-1 capitalize">Status: {med.status}</p>
                                {med.authoredOn && (
                                  <p className="text-xs text-muted-foreground mt-1">Prescribed: {new Date(med.authoredOn).toLocaleDateString()}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm p-4 border border-dashed rounded-lg text-center bg-card">No active medications.</p>
                        )}
                      </div>

                      {/* Reports */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-500" />
                            Diagnostic Reports
                          </h4>
                          <button 
                            onClick={() => setIsAddingReport(!isAddingReport)}
                            className="text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                          >
                            {isAddingReport ? "Cancel" : "+ Add Report"}
                          </button>
                        </div>
                        
                        {isAddingReport && (
                          <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 mb-4 space-y-3">
                            <input 
                              type="text" 
                              placeholder="Report Name (e.g. CBC, X-Ray)" 
                              value={reportName}
                              onChange={(e) => setReportName(e.target.value)}
                              className="w-full text-sm px-3 py-2 border rounded-md focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                            <div className="relative">
                              <textarea 
                                placeholder="Conclusion / Findings..." 
                                value={reportConclusion}
                                onChange={(e) => setReportConclusion(e.target.value)}
                                className="w-full text-sm px-3 py-2 border rounded-md focus:ring-1 focus:ring-orange-500 outline-none h-20 resize-none pr-10"
                              />
                              <button
                                type="button"
                                onClick={toggleListen}
                                className={`absolute right-2 bottom-2 p-1.5 rounded-full transition-colors ${
                                  isListening 
                                    ? "bg-red-100 text-red-600 animate-pulse" 
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                                title="Click to dictate"
                              >
                                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                              </button>
                            </div>
                            <button 
                              onClick={submitReport}
                              disabled={reportSubmitting}
                              className="w-full bg-orange-600 text-white text-sm font-medium py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
                            >
                              {reportSubmitting ? "Saving..." : "Save Report"}
                            </button>
                          </div>
                        )}
                        {patientBundle?.diagnosticReports && patientBundle.diagnosticReports.length > 0 ? (
                          <div className="grid gap-3">
                            {patientBundle.diagnosticReports.map((rep: any, i: number) => (
                              <div key={i} className="bg-card border rounded-lg p-4">
                                <p className="font-semibold text-orange-700">{rep.code?.text || "Medical Report"}</p>
                                <p className="text-sm text-muted-foreground mt-1 capitalize">Status: {rep.status}</p>
                                {(rep.issued || rep.effectiveDateTime) && (
                                  <p className="text-xs text-muted-foreground mt-1">Issued: {new Date(rep.issued || rep.effectiveDateTime).toLocaleDateString()}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm p-4 border border-dashed rounded-lg text-center bg-card">No diagnostic reports.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
