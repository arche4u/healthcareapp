/**
 * OneHealth Doctor Dashboard
 * Fetches real patient queue from identity-svc API.
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, LogOut, Users, Calendar, FileText, Settings,
  ChevronRight, CheckCircle, AlertCircle, Clock, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost";
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost/auth";

interface Patient {
  id: string;
  name?: Array<{ family?: string; given?: string[] }>;
  telecom?: Array<{ value?: string; system?: string }>;
  identifier?: Array<{ system?: string; value?: string }>;
  gender?: string;
  birthDate?: string;
  abhaId?: string;
}

interface Encounter {
  id: string;
  status: string;
  period?: { start?: string; end?: string };
  reasonCode?: Array<{ text?: string }>;
  class?: { text?: string };
}

interface QueueItem {
  encounter: Encounter;
  patient: Patient;
  intakeSummary?: Record<string, any>;
  triagePriority?: "low" | "normal" | "high" | "urgent";
}

interface HospitalInfo {
  id: string;
  name: string;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent": return "bg-red-500/10 text-red-600 border-red-500/20";
    case "high": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "normal": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "low": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case "urgent": return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "high": return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "normal": return <Clock className="h-4 w-4 text-blue-500" />;
    case "low": return <CheckCircle className="h-4 w-4 text-gray-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospital, setHospital] = useState<HospitalInfo | null>(null);
  const [doctor, setDoctor] = useState<{ name: string; specialty: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/signin");
      return;
    }

    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      setLoading(true);

      // Get current user info
      const userinfoRes = await fetch(`${AUTH_BASE}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userinfoRes.ok) {
        localStorage.removeItem("accessToken");
        router.push("/auth/signin");
        return;
      }

      const userinfo = await userinfoRes.json();
      setDoctor({
        name: userinfo.full_name || "Doctor",
        specialty: "General Medicine",
      });

      if (userinfo.hospital_id) {
        setHospital({ id: userinfo.hospital_id, name: "OneHealth Medical Center" });
        // Fetch queue
        const queueRes = await fetch(
          `${API_BASE}/api/identity/queue/hospital/${userinfo.hospital_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (queueRes.ok) {
          const queueData = await queueRes.json();
          setQueue(queueData.queue || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/auth/signin");
  };

  const filteredQueue = searchTerm
    ? queue.filter(item => {
        const name = item.patient.name?.[0]?.given?.join(" ") + " " + item.patient.name?.[0]?.family || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : queue;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                OneHealth
              </span>
            </Link>
            {hospital && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                / {hospital.name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {queue.filter(q => q.triagePriority === "urgent").length}
              </span>
            </button>
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3 pl-3 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold">
                {(doctor?.name || "DR")[0]}
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-medium">{doctor?.name || "Loading..."}</p>
                <p className="text-xs text-muted-foreground">{doctor?.specialty || "General Medicine"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Date & Stats */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Today's Patient Queue</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center space-x-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{queue.length}</div>
              <p className="text-xs text-muted-foreground">Patients Today</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">
                {queue.filter(q => q.triagePriority === "urgent" || q.triagePriority === "high").length}
              </div>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mb-6">
            {error}
          </div>
        )}

        {/* Queue List */}
        <div className="space-y-4">
          {filteredQueue.map((item) => (
            <Link
              href={`/patients/${item.patient.id}`}
              key={item.encounter.id}
            >
              <div className="group p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Priority indicator */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {getPriorityIcon(item.triagePriority || "normal")}
                    </div>

                    {/* Patient info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          {item.patient.name?.[0]?.given?.join(" ")} {item.patient.name?.[0]?.family}
                        </h3>
                        {item.triagePriority && (
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(item.triagePriority)}`}>
                            {item.triagePriority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.patient.abhaId ||
                         item.patient.identifier?.[0]?.value ||
                         "ID: " + item.patient.id}
                      </p>
                    </div>
                  </div>

                  {/* Chief complaint */}
                  <div className="flex-1 max-w-md ml-6">
                    <p className="text-sm text-foreground/80">
                      {item.intakeSummary?.chiefComplaint ||
                       item.encounter.reasonCode?.[0]?.text ||
                       "No complaint recorded"}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="text-right ml-6">
                    <p className="font-medium">
                      {item.encounter.period?.start
                        ? new Date(item.encounter.period.start).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "On time"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.encounter.status === "arrived" ? "Waiting" :
                       item.encounter.status === "triaged" ? "Triaged" :
                       item.encounter.status === "in-progress" ? "In Consultation" :
                       item.encounter.status || "Scheduled"}
                    </p>
                  </div>

                  {/* Navigation */}
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filteredQueue.length === 0 && !error && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No patients in queue</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No patients match your search."
                : "No patients are currently waiting for consultation today."}
            </p>
            {hospital && (
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Refresh Queue
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// revalidate = 0 removed — this is a client component