"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Stethoscope, UserCheck, Plus, X, Loader2,
  CheckCircle, AlertCircle, Eye, EyeOff, Search, RefreshCw,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type StaffMember = {
  id: string;
  email: string;
  full_name: string;
  role: "doctor" | "nurse";
  status: string;
  specialty: string;
  practitioner_id?: string;
  created_at?: string;
};

const SPECIALTIES = [
  "General Medicine", "Cardiology", "Neurology", "Orthopedics",
  "Pediatrics", "Gynecology", "Dermatology", "Psychiatry",
  "Oncology", "Radiology", "Surgery", "Emergency Medicine",
  "Ophthalmology", "ENT", "Endocrinology", "Nephrology",
];

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [hospital, setHospital] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "doctor" | "nurse">("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [addRole, setAddRole] = useState<"doctor" | "nurse">("doctor");
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", specialty: "", phone: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authAPI.getStaff();
      setStaff(res.staff || []);
      setHospital(res.hospital || {});
    } catch {
      setError("Failed to load staff. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const openModal = (role: "doctor" | "nurse") => {
    setAddRole(role);
    setForm({ full_name: "", email: "", password: "", specialty: "", phone: "" });
    setAddError("");
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!form.full_name || !form.email || !form.password) {
      setAddError("Name, email, and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setAddError("Password must be at least 8 characters.");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const res = await authAPI.registerStaff({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: addRole,
        specialty: form.specialty,
        phone: form.phone,
      });
      if (res.error) { setAddError(res.error); return; }
      setShowModal(false);
      setSuccessMsg(`${addRole === "doctor" ? "Dr." : ""} ${form.full_name} added successfully! They can now sign in.`);
      await loadStaff();
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch {
      setAddError("Failed to add staff member. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const filtered = staff.filter((s) => {
    const matchRole = filterRole === "all" || s.role === filterRole;
    const matchSearch = !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.specialty || "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const doctors = staff.filter(s => s.role === "doctor");
  const nurses = staff.filter(s => s.role === "nurse");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            {hospital.name} · {staff.length} registered staff members
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadStaff} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => openModal("doctor")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Doctor
          </Button>
          <Button variant="outline" onClick={() => openModal("nurse")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Nurse
          </Button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMsg}</p>
            <p className="text-sm mt-0.5 opacity-80">They can now sign in at <span className="font-mono">localhost/auth/signin</span> and will be routed to the correct dashboard.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Doctors", count: doctors.length, icon: Stethoscope, color: "blue" },
          { label: "Nurses", count: nurses.length, icon: UserCheck, color: "green" },
          { label: "Total", count: staff.length, icon: Users, color: "purple" },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full bg-${color}-500/10 text-${color}-600 flex items-center justify-center shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email or specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {(["all", "doctor", "nurse"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                filterRole === r ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === "all" ? "All" : r === "doctor" ? "Doctors" : "Nurses"}
            </button>
          ))}
        </div>
      </div>

      {/* Staff table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {staff.length === 0 ? "No staff registered yet" : "No results match your search"}
          </p>
          {staff.length === 0 && (
            <p className="text-sm mt-1">Add your first doctor or nurse using the buttons above.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Staff Member</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Specialty</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {s.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      s.role === "doctor"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    )}>
                      {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{s.specialty || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      s.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Add {addRole === "doctor" ? "Doctor" : "Nurse"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Set their login credentials. They can sign in immediately.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role toggle inside modal */}
            <div className="flex gap-2">
              {(["doctor", "nurse"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAddRole(r)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                    addRole === r ? "bg-primary/10 border-primary text-primary" : "border-input text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {r === "doctor" ? "👨‍⚕️ Doctor" : "👩‍⚕️ Nurse"}
                </button>
              ))}
            </div>

            {addError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {addError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder={addRole === "doctor" ? "Dr. Priya Sharma" : "Kavya Reddy"}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@hospital.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Login Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className={cn(inputClass, "pr-10")}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This will be their sign-in password.</p>
              </div>
              {addRole === "doctor" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Specialty</label>
                  <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className={inputClass}>
                    <option value="">Select specialty…</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210" className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={adding}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdd} disabled={adding}>
                {adding
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding…</>
                  : `Add ${addRole === "doctor" ? "Doctor" : "Nurse"}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
