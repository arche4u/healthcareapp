"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, FileText, Settings, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const navItems = [
  { name: "Queue", href: "/dashboard", icon: Activity },
  { name: "Patients", href: "/dashboard/patients", icon: Users },
  { name: "Prescriptions", href: "/dashboard/prescribe", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    import("@/lib/api").then(({ authAPI }) => {
      authAPI.userinfo()
        .then(setUser)
        .catch(console.error);
    });
  }, []);

  const initials = user?.full_name 
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : "DR";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OneHealth
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Doctor Dashboard</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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

        <div className="p-4 border-t border-border">
          <Link href="/auth/signin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </span>
            <div className="flex-1 text-left">
              <p className="font-medium truncate">{user?.full_name || "Dr. Rao"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ") || "General Medicine"}</p>
            </div>
          </Link>
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

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}