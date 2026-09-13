"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar, Activity, FileText, Camera, Sparkles } from "lucide-react";
import { authAPI, identityAPI, predictionAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { FaceScanner } from "@/components/biometrics/FaceScanner";
import { format, isFuture, addDays } from "date-fns";
import { VitalsMonitor } from "@/components/patient/VitalsMonitor";
import { HealthScoreCard } from "@/components/patient/HealthScoreCard";

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isFaceScanOpen, setIsFaceScanOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bundle, setBundle] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const u = await authAPI.userinfo();
        setUser(u);
        const patientId = u.patient_id || u.id;
        if (patientId) {
          const b = await identityAPI.getPatientBundle(patientId);
          setBundle(b);

          const pastEncs = (b.encounters || [])
            .filter((e: any) => e.period?.start && !isFuture(new Date(e.period.start)))
            .sort((a: any, b: any) => new Date(b.period.start).getTime() - new Date(a.period.start).getTime());

          let diagnosisText = "";
          let doctorId = "";
          if (pastEncs.length > 0) {
            diagnosisText = pastEncs[0].diagnosis?.[0]?.condition?.display || "";
            doctorId = pastEncs[0].participant?.[0]?.individual?.reference?.split('/')[1] || "";
          }

          try {
            const pred = await predictionAPI.predictNextVisit({
              patient_id: patientId,
              diagnosis_text: diagnosisText,
              doctor_id: doctorId
            });
            setPrediction(pred);
          } catch (e) {
            console.error("Prediction failed:", e);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'triage_updated' || data.type === 'encounter_updated' || data.type === 'encounter_booked' || data.type === 'medication_prescribed') {
          loadProfile(); // Reload the whole profile/bundle to get fresh data
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => eventSource.close();
  }, []);

  const encounters = bundle?.encounters || [];
  const medications = bundle?.medications || [];
  const reports = bundle?.diagnostic_reports || [];
  
  const upcomingEncounters = encounters
    .filter((e: any) => e.period?.start && isFuture(new Date(e.period.start)))
    .sort((a: any, b: any) => new Date(a.period.start).getTime() - new Date(b.period.start).getTime());
    
  const pastEncounters = encounters
    .filter((e: any) => e.period?.start && !isFuture(new Date(e.period.start)))
    .sort((a: any, b: any) => new Date(b.period.start).getTime() - new Date(a.period.start).getTime());

  const nextAppointment = upcomingEncounters.length > 0 ? upcomingEncounters[0] : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.full_name ? user.full_name.split(' ')[0] : "Patient"}</h1>
          <p className="text-muted-foreground mt-1">Walk in to any supported hospital and scan your face at the front desk to check-in instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsFaceScanOpen(true)} className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Register Face ID
          </Button>
        </div>
      </div>

      {/* Quick Stats / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Animated Health Score Card */}
        <HealthScoreCard bundle={bundle} />

        <div className="p-6 rounded-xl border bg-card hover:shadow-sm transition-shadow relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Next-Visit Prediction
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full">AI</span>
            </h3>
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="relative">
            {prediction ? (
              <>
                <p className="text-2xl font-bold">{format(new Date(prediction.prediction?.recommended_window_start || new Date()), "MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground mt-1">{prediction.prediction?.basis || "Based on standard follow-up"}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold mt-2 text-muted-foreground">Calculating...</p>
                <p className="text-sm text-muted-foreground mt-1">Analyzing your health profile</p>
              </>
            )}
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Records</h3>
            <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold">{reports.length} records</p>
          <p className="text-sm text-muted-foreground mt-1">{reports.length > 0 ? "New clinical notes available" : "No new clinical notes"}</p>
        </div>

        <div className="p-6 rounded-xl border bg-card hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Active Medications</h3>
            <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold">{medications.length} active</p>
          <p className="text-sm text-muted-foreground mt-1">{medications.length > 0 ? "Ongoing prescriptions" : "No ongoing prescriptions"}</p>
        </div>
      </div>
      
      {/* Vitals Monitor */}
      <VitalsMonitor observations={bundle?.observations || []} />


      {/* Notifications / Triage placeholder */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Recent Updates
          </h2>
        </div>
        <div className="p-12 text-center text-muted-foreground">
          <p>No recent notifications or updates.</p>
        </div>
      </div>

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
                <h3 className="font-semibold text-lg">Register Face Biometrics</h3>
                <button
                  onClick={() => setIsFaceScanOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Register your face to enable instant check-ins and cross-hospital syncing without needing an ID card.
                </p>
                <FaceScanner 
                  isLoading={submitting} 
                  onScanComplete={async (imageBase64) => {
                    if (!user?.id) return;
                    setSubmitting(true);
                    try {
                      const res = await fetch('/api/identity/register-face', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        },
                        body: JSON.stringify({ 
                          patient_id: user.patient_id || user.id,
                          image: imageBase64 
                        })
                      });
                      
                      const data = await res.json();
                      if (res.ok) {
                        alert("Face successfully registered!");
                        setIsFaceScanOpen(false);
                      } else {
                        alert(`Failed: ${data.error}`);
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Network error connecting to Identity Service.');
                    } finally {
                      setSubmitting(false);
                    }
                  }} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
