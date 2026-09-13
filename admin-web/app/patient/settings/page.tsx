"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, Save, Loader2, CheckCircle, AlertCircle, Shield, Bell, Eye, EyeOff } from "lucide-react";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function SectionCard({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
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

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow disabled:opacity-50";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
  }, []);

  const handleProfileSave = async () => {
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await authAPI.updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
      });
      if (updated.error) {
        setProfileMsg({ type: "error", text: updated.error });
      } else {
        setUser((u: any) => ({ ...u, ...updated }));
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 5000);
    }
  };

  const handlePasswordSave = async () => {
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
      if (res.error) {
        setPwMsg({ type: "error", text: res.error });
      } else {
        setPwMsg({ type: "success", text: "Password changed successfully!" });
        setPwForm({ password: "", confirm: "" });
      }
    } catch {
      setPwMsg({ type: "error", text: "Failed to change password." });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 5000);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : "PT";

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
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Avatar preview */}
      <div className="flex items-center gap-4 p-5 rounded-xl border bg-card">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold select-none">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.full_name || "Patient"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
            {user?.role || "patient"}
          </span>
        </div>
      </div>

      {/* Profile section */}
      <SectionCard title="Profile" description="Update your personal information." icon={User}>
        <div className="space-y-4">
          <Field label="Full Name">
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              placeholder="Your full name"
              className={inputClass}
            />
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>

          {profileMsg && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg text-sm border",
              profileMsg.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            )}>
              {profileMsg.type === "success"
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleProfileSave} disabled={profileSaving} className="flex items-center gap-2">
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Security section */}
      <SectionCard title="Security" description="Change your password." icon={Shield}>
        <div className="space-y-4">
          <Field label="New Password">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwForm.password}
                onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                placeholder="At least 8 characters"
                className={cn(inputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm New Password">
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Repeat password"
                className={cn(inputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* Password strength indicator */}
          {pwForm.password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((lvl) => {
                  const strength = Math.min(4, Math.floor(pwForm.password.length / 3));
                  return (
                    <div
                      key={lvl}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        lvl <= strength
                          ? strength <= 1 ? "bg-red-400" : strength <= 2 ? "bg-yellow-400" : strength <= 3 ? "bg-blue-400" : "bg-green-400"
                          : "bg-muted"
                      )}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {pwForm.password.length < 8 ? "Too short" : pwForm.password.length < 12 ? "Fair" : pwForm.password.length < 16 ? "Good" : "Strong"}
              </p>
            </div>
          )}

          {pwMsg && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg text-sm border",
              pwMsg.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            )}>
              {pwMsg.type === "success"
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />}
              {pwMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handlePasswordSave} disabled={pwSaving} variant="outline" className="flex items-center gap-2">
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Change Password
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Account info (read-only) */}
      <SectionCard title="Account Info" description="Read-only account details." icon={Bell}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user?.role || "patient"}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{user?.sub || "—"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Token expires</span>
            <span className="font-medium">
              {user?.exp ? new Date(user.exp * 1000).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
