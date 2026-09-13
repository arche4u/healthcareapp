import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CheckCircle2, Activity, Server, Database, Cloud } from "lucide-react";

export default function StatusPage() {
  const systems = [
    { name: "Web Portal", status: "Operational", uptime: "99.99%", icon: Cloud },
    { name: "Identity & Face Match API", status: "Operational", uptime: "100%", icon: Activity },
    { name: "FHIR Core API", status: "Operational", uptime: "99.98%", icon: Database },
    { name: "Auth & SSO", status: "Operational", uptime: "99.99%", icon: Server },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col items-center justify-center text-center mb-12">
            <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-full flex items-center gap-2 mb-6 text-sm font-semibold border border-green-500/20 shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
              All Systems Operational
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              System Status
            </h1>
            <p className="text-xl text-muted-foreground">
              Real-time monitoring for OneHealth services and APIs.
            </p>
          </div>

          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-12">
            <div className="p-6 border-b bg-muted/30 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Service Status</h2>
              <span className="text-sm text-muted-foreground">Updated just now</span>
            </div>
            <div className="divide-y">
              {systems.map((sys, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <sys.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{sys.name}</h3>
                      <p className="text-sm text-muted-foreground">Uptime: {sys.uptime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    {sys.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
