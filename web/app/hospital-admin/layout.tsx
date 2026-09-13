"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Settings, ChevronRight,
  Bell, Building2, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authAPI, clearTokens } from "@/lib/api";
import { Button } from "@/components/ui/Button";

const navItems = [
  { name: "Overview", href: "/hospital-admin", icon: LayoutDashboard },
  { name: "Staff", href: "/hospital-admin/staff", icon: Users },
  { name: "Settings", href: "/hospital-admin/settings", icon: Settings },
];

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);

  useEffect(() => {
    // Auth guard
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/signin"); return; }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "hospital_admin") {
        // Redirect to correct portal
        if (payload.role === "patient") router.push("/patient");
        else if (payload.role === "nurse") router.push("/nurse");
        else router.push("/dashboard");
        return;
      }
    } catch { router.push("/auth/signin"); return; }

    authAPI.userinfo().then(setUser).catch(console.error);
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.push("/auth/signin");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : "HA";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OneHealth
            </span>
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Hospital Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/hospital-admin" && pathname.startsWith(`${item.href}`));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {active && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <span className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.full_name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden border-b border-border bg-card p-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            OneHealth
          </Link>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
