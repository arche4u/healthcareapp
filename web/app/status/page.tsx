import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CheckCircle2, AlertCircle, Clock, Server } from "lucide-react";

export default function StatusPage() {
  const services = [
    { name: "ABHA Creation API (Milestone 1)", status: "operational" },
    { name: "Health Information Provider (HIP) Bridge", status: "operational" },
    { name: "Health Information User (HIU) Bridge", status: "operational" },
    { name: "Consent Manager (Patient App)", status: "operational" },
    { name: "FHIR Clinical Data Repository", status: "operational" },
    { name: "Identity & Authentication Service", status: "operational" },
    { name: "Hospital Admin Portal", status: "operational" }
  ];

  const pastIncidents = [
    {
      date: "October 2, 2025",
      title: "Elevated latency on ABDM Gateway",
      status: "Resolved",
      desc: "Between 14:00 IST and 15:30 IST, the central NDHM gateway experienced elevated latency, causing delays in ABHA OTP generation. Our internal systems remained fully operational. The issue was resolved upstream by the NHA."
    },
    {
      date: "September 15, 2025",
      title: "Scheduled Maintenance: Database Upgrades",
      status: "Completed",
      desc: "Successfully completed zero-downtime rolling upgrades to our FHIR PostgreSQL clusters to support new SNOMED CT terminology bindings."
    }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-muted/20">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-12 max-w-4xl mx-auto space-y-6 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            System Status
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time status of OneHealth APIs and ABDM network connectivity.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 space-y-12">
          
          {/* Overall Status Banner */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400">All Systems Operational</h2>
              <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Last updated: Just now</p>
            </div>
          </div>

          {/* Individual Services */}
          <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Server className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-bold">Core Infrastructure</h3>
            </div>
            <div className="divide-y divide-border">
              {services.map((service, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <span className="font-medium text-foreground">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium capitalize">
                      {service.status}
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Past Incidents */}
          <section className="space-y-6 pt-8 border-t border-border">
            <h3 className="text-2xl font-bold">Past Incidents</h3>
            <div className="space-y-8">
              {pastIncidents.map((incident, i) => (
                <div key={i} className="relative pl-8 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-border">
                  <div className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full bg-muted-foreground border-2 border-background" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{incident.date}</p>
                    <h4 className="text-lg font-bold text-foreground flex items-center gap-3">
                      {incident.title}
                      <span className="text-xs font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {incident.status}
                      </span>
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">{incident.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
