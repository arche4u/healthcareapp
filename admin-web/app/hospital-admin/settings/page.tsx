"use client";

import { useEffect, useState } from "react";
import {
  Building2, User, Shield, Save, Loader2,
  CheckCircle, AlertCircle, Eye, EyeOff, MapPin, Phone, Mail,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow disabled:opacity-50";

function SectionCard({
  title, description, icon: Icon, children,
}: {
  title: string; description: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-6 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function StatusMsg({ msg }: { msg: { type: "success" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg text-sm border",
      msg.type === "success"
        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
    )}>
      {msg.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {msg.text}
    </div>
  );
}

export default function HospitalAdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hospital form (read from userinfo, update via updateProfile)
  const [hospitalForm, setHospitalForm] = useState({
    hospital_name: "", city: "", state: "", phone: "",
  });
  const [hospitalSaving, setHospitalSaving] = useState(false);
  const [hospitalMsg, setHospitalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    authAPI.userinfo()
      .then((u) => {
        setUser(u);
        setProfileForm({ full_name: u.full_name || "", email: u.email || "" });
      })
      .catch(console.error)
      .finally(() => setLoadingUser(false));

    // Load hospital info from staff endpoint
    authAPI.getStaff()
      .then((s) => {
        const h = s.hospital || {};
        setHospitalForm((f) => ({
          ...f,
          hospital_name: h.name || "",
        }));
      })
      .catch(console.error);
  }, []);

  const saveProfile = async () => {
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await authAPI.updateProfile({ full_name: profileForm.full_name, email: profileForm.email });
      if (res.error) { setProfileMsg({ type: "error", text: res.error }); }
      else {
        setUser((u: any) => ({ ...u, ...res }));
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      }
    } catch { setProfileMsg({ type: "error", text: "Failed to update profile." }); }
    finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 5000);
    }
  };

  const saveHospital = async () => {
    if (!hospitalForm.hospital_name.trim()) {
      setHospitalMsg({ type: "error", text: "Hospital name is required." });
      return;
    }
    setHospitalSaving(true);
    setHospitalMsg(null);
    try {
      // Hospital update via auth profile endpoint (extended)
      const res = await authAPI.updateProfile({
        hospital_name: hospitalForm.hospital_name,
        hospital_city: hospitalForm.city,
        hospital_state: hospitalForm.state,
      } as any);
      if (res.error) { setHospitalMsg({ type: "error", text: res.error }); }
      else { setHospitalMsg({ type: "success", text: "Hospital information updated!" }); }
    } catch { setHospitalMsg({ type: "error", text: "Failed to update hospital info." }); }
    finally {
      setHospitalSaving(false);
      setTimeout(() => setHospitalMsg(null), 5000);
    }
  };

  const savePassword = async () => {
    if (pwForm.password.length < 8) {
      setPwMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await authAPI.updateProfile({ password: pwForm.password });
      if (res.error) { setPwMsg({ type: "error", text: res.error }); }
      else {
        setPwMsg({ type: "success", text: "Password changed successfully!" });
        setPwForm({ password: "", confirm: "" });
      }
    } catch { setPwMsg({ type: "error", text: "Failed to change password." }); }
    finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 5000);
    }
  };

  const pwStrength = Math.min(4, Math.floor(pwForm.password.length / 3));

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : "HA";

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your hospital and account preferences.</p>
      </div>

      {/* Admin identity card */}
      <div className="flex items-center gap-4 p-5 rounded-xl border bg-card">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold select-none shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.full_name || "Admin"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Hospital Admin
          </span>
        </div>
      </div>

      {/* Hospital info */}
      <SectionCard title="Hospital Information" description="Update your hospital's name and location." icon={Building2}>
        <div className="space-y-4">
          <Field label="Hospital Name">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={hospitalForm.hospital_name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, hospital_name: e.target.value })}
                placeholder="e.g. City Medical Center"
                className={cn(inputClass, "pl-9")} />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={hospitalForm.city}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                  placeholder="City"
                  className={cn(inputClass, "pl-9")} />
              </div>
            </Field>
            <Field label="State">
              <input type="text" value={hospitalForm.state}
                onChange={(e) => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                placeholder="State"
                className={inputClass} />
            </Field>
          </div>
          <Field label="Contact Phone">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="tel" value={hospitalForm.phone}
                onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                placeholder="+91 11 1234 5678"
                className={cn(inputClass, "pl-9")} />
            </div>
          </Field>
          <StatusMsg msg={hospitalMsg} />
          <div className="flex justify-end">
            <Button onClick={saveHospital} disabled={hospitalSaving} className="gap-2">
              {hospitalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Hospital Info
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Admin profile */}
      <SectionCard title="Admin Profile" description="Update your personal details." icon={User}>
        <div className="space-y-4">
          <Field label="Full Name">
            <input type="text" value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              placeholder="Your full name"
              className={inputClass} />
          </Field>
          <Field label="Email Address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="you@hospital.com"
                className={cn(inputClass, "pl-9")} />
            </div>
          </Field>
          <StatusMsg msg={profileMsg} />
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={profileSaving} className="gap-2">
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Security */}
      <SectionCard title="Security" description="Change your admin account password." icon={Shield}>
        <div className="space-y-4">
          <Field label="New Password">
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={pwForm.password}
                onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                placeholder="At least 8 characters"
                className={cn(inputClass, "pr-10")} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password">
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Repeat password"
                className={cn(inputClass, "pr-10")} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {pwForm.password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((lvl) => (
                  <div key={lvl} className={cn("h-1.5 flex-1 rounded-full transition-colors",
                    lvl <= pwStrength
                      ? pwStrength <= 1 ? "bg-red-400" : pwStrength <= 2 ? "bg-yellow-400" : pwStrength <= 3 ? "bg-blue-400" : "bg-green-400"
                      : "bg-muted")} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {pwForm.password.length < 8 ? "Too short" : pwStrength <= 2 ? "Fair" : pwStrength === 3 ? "Good" : "Strong"}
              </p>
            </div>
          )}

          <StatusMsg msg={pwMsg} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={savePassword} disabled={pwSaving} className="gap-2">
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Change Password
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Read-only account info */}
      <div className="rounded-xl border bg-card p-5 space-y-3 text-sm">
        <h3 className="font-semibold">Account Info</h3>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">Hospital Admin</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Account ID</span>
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{user?.sub || "—"}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-muted-foreground">Session expires</span>
          <span className="font-medium">
            {user?.exp
              ? new Date(user.exp * 1000).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
