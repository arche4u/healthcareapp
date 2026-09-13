import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Sparkles, Bug, Zap, Package } from "lucide-react";

export default function ChangelogPage() {
  const logs = [
    {
      version: "v2.4.0",
      date: "October 10, 2025",
      changes: [
        { type: "feature", text: "Added support for FHIR R4 DocumentReference resources to allow attaching DICOM image links directly to patient encounters." },
        { type: "feature", text: "New ABDM Consent Manager dashboard for Hospital Admins to track pending consent requests." },
        { type: "improvement", text: "Optimized the patient search query in the Nurse Portal, reducing load times by 40%." },
        { type: "fix", text: "Resolved an issue where ABHA generation OTPs were occasionally timing out on the BSNL network." }
      ]
    },
    {
      version: "v2.3.5",
      date: "September 28, 2025",
      changes: [
        { type: "feature", text: "Introduced AI-assisted clinical triage in the Doctor Dashboard based on historical Vitals (Requires patient explicit consent)." },
        { type: "improvement", text: "Upgraded Next.js to v14.2 for better static generation performance." },
        { type: "fix", text: "Fixed a bug in the charting module where heart rate graphs would overlap on mobile devices." }
      ]
    },
    {
      version: "v2.3.0",
      date: "September 15, 2025",
      changes: [
        { type: "feature", text: "Full rollout of the offline-tolerant PWA mode for rural clinics with spotty internet." },
        { type: "improvement", text: "Switched to WebP for all internal medical diagrams to save bandwidth." },
        { type: "security", text: "Rotated all internal JWT signing keys and enforced 2FA for all Hospital Admins." }
      ]
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'improvement': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'fix': return <Bug className="w-5 h-5 text-red-500" />;
      case 'security': return <Package className="w-5 h-5 text-green-500" />;
      default: return <Sparkles className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'feature': return <span className="text-xs font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">Feature</span>;
      case 'improvement': return <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Improvement</span>;
      case 'fix': return <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Bug Fix</span>;
      case 'security': return <span className="text-xs font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Security</span>;
      default: return null;
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-muted/20">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-16 max-w-3xl mx-auto space-y-6 pt-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Changelog
          </h1>
          <p className="text-xl text-muted-foreground">
            New updates and improvements to the OneHealth platform.
          </p>
        </header>

        <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-16 space-y-16">
          {logs.map((log, i) => (
            <div key={i} className="relative pl-8 md:pl-0">
              
              {/* Timeline Line (Desktop hidden, Mobile visible) */}
              <div className="md:hidden absolute inset-y-0 left-0 w-px bg-border" />
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                
                {/* Version & Date Side */}
                <div className="md:w-48 shrink-0 relative">
                  {/* Mobile Dot */}
                  <div className="md:hidden absolute left-[-37px] top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="sticky top-24 space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">{log.version}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{log.date}</p>
                  </div>
                </div>

                {/* Changes Side */}
                <div className="flex-1 bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
                  {log.changes.map((change, j) => (
                    <div key={j} className="flex gap-4">
                      <div className="shrink-0 mt-0.5">
                        {getIcon(change.type)}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {getBadge(change.type)}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {change.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
