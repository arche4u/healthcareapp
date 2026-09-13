"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Building, LogOut, Palette } from "lucide-react";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await authAPI.userinfo();
        setUser(u);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth/signin";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account preferences and profile</p>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Your personal account details</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
              <div className="px-4 py-2 bg-background border rounded-lg text-sm font-medium">{user?.full_name || "N/A"}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
              <div className="px-4 py-2 bg-background border rounded-lg text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {user?.email || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Account Role</label>
              <div className="px-4 py-2 bg-background border rounded-lg text-sm flex items-center gap-2 capitalize">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {user?.role?.replace("_", " ") || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned Hospital ID</label>
              <div className="px-4 py-2 bg-background border rounded-lg text-sm flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                {user?.hospital_id || "None Assigned"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Customize colors and display mode</p>
        </div>
        <div className="p-6">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden border-red-500/20">
        <div className="p-6 border-b border-red-500/10 bg-red-500/5">
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device. You will need to log back in to access the dashboard.
          </p>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
