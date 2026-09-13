"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Bell, LogOut, Users, Calendar, FileText, Settings,
  ChevronRight, CheckCircle, AlertCircle, Clock, Activity, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { appointmentsAPI, authAPI } from "@/lib/api";

function DashboardContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("Doctor");
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>("General Medicine");

  useEffect(() => {
    setMounted(true);
    // Check auth
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/signin");
      return;
    }

    const fetchQueue = async () => {
      try {
        setIsLoading(true);
        const user = await authAPI.userinfo();

        // If token is expired or invalid, redirect to login
        if (user.error || user.msg) {
          router.push("/auth/signin");
          return;
        }

        if (user.full_name) {
          setDoctorName(user.full_name);
        }
        if (user.specialty) {
          setDoctorSpecialty(user.specialty);
        }
        if (!user.hospital_id) {
          setError("No hospital assigned to this doctor account. Please contact your administrator.");
          return;
        }
        
        // Fetch all encounters for today
        const response = await appointmentsAPI.listForHospital(user.hospital_id);
        if (response.error) {
          setError(`Failed to load appointments: ${response.error}`);
          return;
        }
        if (response.encounters) {
           setEncounters(response.encounters);
        } else {
           setEncounters([]);
        }
      } catch (err) {
        console.error("Failed to fetch queue:", err);
        setError("Failed to load patient queue. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, [router]);

  // Real-time Event Listener (SSE)
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'patient_matched' || data.type === 'intake_completed' || data.type === 'encounter_updated') {
          // In a real app, we would fetch specific encounter or merge data.
          // For simplicity, we trigger a refresh of the queue when an event occurs.
          const fetchQueue = async () => {
            const user = await authAPI.userinfo();
            if (user.hospital_id) {
              const response = await appointmentsAPI.listForHospital(user.hospital_id);
              if (response.encounters) {
                 setEncounters(response.encounters);
              }
            }
          };
          fetchQueue();
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  const formatName = (nameObj: any[]) => {
    if (!nameObj || nameObj.length === 0) return "Unknown";
    return `${nameObj[0].given?.join(" ") || ""} ${nameObj[0].family || ""}`.trim();
  };

  // Filter queue logic
  const waiting = encounters.filter(e => e.status === "planned" || e.status === "arrived");
  const ready = encounters.filter(e => e.status === "triaged");
  const inProgress = encounters.filter(e => e.status === "in-progress");
  const done = encounters.filter(e => e.status === "finished");

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OneHealth
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Doctor Dashboard</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 pl-3 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold uppercase">
                {doctorName?.substring(0, 2) || "DR"}
              </div>
              <div className="text-right">
                <p className="font-medium">{doctorName}</p>
                <p className="text-xs text-muted-foreground">{doctorSpecialty || "General Medicine"}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Today&apos;s Appointments</h1>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="bg-card border rounded-lg p-3 px-5 text-center">
                <div className="text-2xl font-bold text-primary">{encounters.length}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</div>
              </div>
              <div className="bg-card border rounded-lg p-3 px-5 text-center">
                <div className="text-2xl font-bold text-blue-500">{waiting.length}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Waiting</div>
              </div>
              <div className="bg-card border rounded-lg p-3 px-5 text-center shadow-sm ring-1 ring-orange-500/20">
                <div className="text-2xl font-bold text-orange-500">{ready.length}</div>
                <div className="text-xs text-orange-500/80 font-medium uppercase tracking-wider">Ready</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Ready for Consultation */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Ready for Consultation ({ready.length + inProgress.length})
              </h2>
              
              {[...inProgress, ...ready].map((enc) => (
                <div key={enc.id} className="bg-card border-2 border-orange-500/20 p-5 rounded-xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {formatName(enc.patient?.name)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {enc.patient?.id?.substring(0, 8)} • Triaged
                      </p>
                    </div>
                    <Link href={`/dashboard/consultation/${enc.id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center gap-2">
                        Start Consultation
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground/80">Chief Complaint:</span>{" "}
                      {enc.reasonCode?.[0]?.text || "None recorded"}
                    </p>
                  </div>
                </div>
              ))}

              {ready.length === 0 && inProgress.length === 0 && (
                <div className="bg-card border border-dashed p-8 rounded-xl text-center text-muted-foreground">
                  No patients are currently ready for consultation.
                </div>
              )}
              
              <h2 className="text-lg font-semibold mt-8 mb-4">Completed Today ({done.length})</h2>
              <div className="space-y-3">
                {done.length === 0 ? (
                  <div className="bg-card border border-dashed p-6 rounded-xl text-center text-muted-foreground">
                    No consultations completed yet today.
                  </div>
                ) : (
                  done.map((enc) => (
                    <div key={enc.id} className="bg-card border p-4 rounded-xl flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                      <div>
                        <h3 className="font-semibold text-lg">{formatName(enc.patient?.name)}</h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>ID: {enc.patient?.id?.substring(0, 8)}</span>
                          {enc.reasonCode && enc.reasonCode[0] && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{enc.reasonCode[0].text}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">Finished</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Col: Waiting Room */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Waiting Room ({waiting.length})
              </h2>
              
              <div className="bg-card border rounded-xl overflow-hidden divide-y divide-border shadow-sm">
                {waiting.map((enc) => (
                  <div key={enc.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{formatName(enc.patient?.name)}</h4>
                      <span className="text-xs px-2 py-1 bg-muted rounded-md border text-muted-foreground">
                        {enc.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate mb-3">
                      {enc.reasonCode?.[0]?.text || "Waiting for triage"}
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white w-full"
                        onClick={() => {
                          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                          if (AudioContext) {
                            const ctx = new AudioContext();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
                            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
                            gain.gain.setValueAtTime(0, ctx.currentTime);
                            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                            osc.start(ctx.currentTime);
                            osc.stop(ctx.currentTime + 0.5);
                          }
                          
                          // Accept the patient
                          appointmentsAPI.accept(enc.id).then((res) => {
                            if (!res.error) {
                              // We trigger a refresh since we want the dashboard to immediately update 
                              // without waiting for SSE event if possible, but SSE will do it anyway.
                              // Wait, SSE will refresh both Doctor's dashboard and Patient's dashboard!
                            } else {
                              setError(res.error);
                            }
                          });
                        }}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 w-full"
                        onClick={() => {
                          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                          if (AudioContext) {
                            const ctx = new AudioContext();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.type = 'sawtooth';
                            osc.frequency.setValueAtTime(150, ctx.currentTime);
                            osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);
                            gain.gain.setValueAtTime(0, ctx.currentTime);
                            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                            osc.start(ctx.currentTime);
                            osc.stop(ctx.currentTime + 0.3);
                          }
                          // Add update logic here in the future
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}

                {waiting.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Waiting room is empty.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <DashboardContent />
    </div>
  );
}