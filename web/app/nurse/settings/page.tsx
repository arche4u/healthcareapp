"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, LogOut, Save } from "lucide-react";
import { authAPI, clearTokens } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function NurseSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const u = await authAPI.userinfo();
        setUser(u);
        setFormData({
          full_name: u.full_name || "",
          email: u.email || "",
          password: ""
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    try {
      const updatePayload: any = {
        full_name: formData.full_name,
        email: formData.email
      };
      if (formData.password) {
        updatePayload.password = formData.password;
      }
      
      const updatedUser = await authAPI.updateProfile(updatePayload);
      if (updatedUser.error) {
        alert(updatedUser.error);
      } else {
        setSuccess("Profile updated successfully!");
        setUser(updatedUser);
        setFormData((prev) => ({ ...prev, password: "" })); // clear password field
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    window.location.href = "/auth/signin";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {success && (
            <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium">
              {success}
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Logging out will clear your current session.
          </p>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
