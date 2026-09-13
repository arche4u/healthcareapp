"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, Stethoscope, Building2, ArrowRight, Loader2, Plus, Activity, RefreshCw } from "lucide-react";
import { authAPI, identityAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type DoctorWorkload = {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  practitioner_id: string | null;
  active_patients: number;
};

export default function HospitalAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctorWorkload, setDoctorWorkload] = useState<DoctorWorkload[]>([]);
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  const loadWorkload = async (hId: string) => {
    setLoadingWorkload(true);
    try {
      const res = await identityAPI.getDoctorsWorkload(hId);
      setDoctorWorkload(res.doctors || []);
    } catch (e) {
      console.error("Failed to load workload", e);
    } finally {
      setLoadingWorkload(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [u, s] = await Promise.all([authAPI.userinfo(), authAPI.getStaff()]);
        setUser(u);
        setStaffData(s);
        if (u?.hospital_id) {
          setHospitalId(u.hospital_id);
          loadWorkload(u.hospital_id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const doctors = staffData?.staff?.filter((s: any) => s.role === "doctor") || [];
  const nurses = staffData?.staff?.filter((s: any) => s.role === "nurse") || [];
  const hospital = staffData?.hospital || {};

  const getWorkloadBadge = (count: number) => {
    if (count === 0) return { label: "Available", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
    if (count <= 2) return { label: "Moderate", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
    return { label: "Busy", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {hospital.name || "Hospital Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.full_name?.split(" ")[0] || "Admin"}. Manage your hospital staff and operations.
          </p>
        </div>
        <Link href="/hospital-admin/staff">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </Link>
      </div>

      {/* Hospital identity card */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shrink-0">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{hospital.name || "Your Hospital"}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Hospital ID: <span className="font-mono">{hospital.id?.substring(0, 12) || "—"}…</span>
          </p>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{doctors.length}</p>
              <p className="text-xs text-muted-foreground">Doctors</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">{nurses.length}</p>
              <p className="text-xs text-muted-foreground">Nurses</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">{doctors.length + nurses.length}</p>
              <p className="text-xs text-muted-foreground">Total Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Doctors", value: doctors.length, icon: Stethoscope, color: "blue" },
          { label: "Total Nurses", value: nurses.length, icon: UserCheck, color: "green" },
          { label: "Total Staff", value: doctors.length + nurses.length, icon: Users, color: "purple" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full bg-${color}-500/10 text-${color}-600 flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor Workload Section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Doctor Workload</h2>
              <p className="text-xs text-muted-foreground">Live patient allocation per doctor</p>
            </div>
          </div>
          <button
            onClick={() => hospitalId && loadWorkload(hospitalId)}
            disabled={loadingWorkload}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingWorkload ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loadingWorkload ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : doctorWorkload.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">No doctors registered</p>
            <p className="text-sm mt-1">Add doctors from the Staff page to see workload here.</p>
          </div>
        ) : (
          <div className="divide-y">
            {doctorWorkload.map((doc) => {
              const badge = getWorkloadBadge(doc.active_patients);
              const barWidth = Math.min((doc.active_patients / 5) * 100, 100);
              return (
                <div key={doc.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {doc.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{doc.full_name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.specialty || "General"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              doc.active_patients === 0
                                ? "bg-green-500"
                                : doc.active_patients <= 2
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {doc.active_patients} patient{doc.active_patients !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent staff */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Staff Overview</h2>
          <Link href="/hospital-admin/staff" className="text-sm text-primary hover:underline flex items-center gap-1">
            Manage all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {staffData?.staff?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No staff registered yet</p>
            <p className="text-sm mt-1">Add your first doctor or nurse to get started.</p>
            <Link href="/hospital-admin/staff" className="mt-4 inline-block">
              <Button size="sm" className="mt-3 gap-2">
                <Plus className="h-4 w-4" /> Add Staff
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {staffData.staff.slice(0, 8).map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {s.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.role === "doctor"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}>
                    {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                  </span>
                  {s.specialty && <p className="text-xs text-muted-foreground mt-0.5">{s.specialty}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}