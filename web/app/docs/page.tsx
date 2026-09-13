import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, Code2, Database, Shield, Zap, Terminal, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      desc: "Quickstart guides for hospitals, clinics, and developers to integrate with OneHealth.",
      links: ["Platform Overview", "Authentication Guide", "Sandbox Environment"]
    },
    {
      title: "ABDM Integration",
      icon: <Shield className="w-6 h-6 text-green-500" />,
      desc: "Detailed manuals on how our system handles ABHA creation and Consent Management.",
      links: ["ABHA Registration Flow", "Consent Artefact Structure", "Handling HIU Callbacks"]
    },
    {
      title: "FHIR Implementation",
      icon: <Database className="w-6 h-6 text-blue-500" />,
      desc: "Deep dive into our HL7 FHIR R4 data models and NDHM profiling.",
      links: ["Supported Resources", "OPConsultRecord Bundle", "Terminology Bindings"]
    },
    {
      title: "API Reference",
      icon: <Code2 className="w-6 h-6 text-purple-500" />,
      desc: "Comprehensive REST API documentation for all OneHealth microservices.",
      links: ["Identity Service API", "Auth Service API", "Clinical Data API"]
    }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-muted/20">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-16 max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Documentation
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to build, integrate, and scale with the OneHealth platform.
          </p>
          
          <div className="max-w-2xl mx-auto relative mt-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Terminal className="w-5 h-5 text-muted-foreground" />
            </div>
            <input 
              type="text" 
              placeholder="Search documentation (e.g., 'ABHA creation', 'FHIR endpoints')" 
              className="w-full bg-background border border-border rounded-xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
            />
          </div>
        </header>

        {/* Grid Sections */}
        <div className="px-4 md:px-8 lg:px-16 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {sections.map((section, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-6">
                {section.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{section.title}</h3>
              <p className="text-muted-foreground mb-6 line-clamp-2">{section.desc}</p>
              
              <ul className="space-y-3 mb-6">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link href="#" className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <Link href="#" className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors mt-auto">
                Explore {section.title} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <section className="px-4 md:px-8 lg:px-16 mt-20">
          <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Need Developer Support?</h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Can't find what you're looking for? Join our developer community or reach out to our integration engineers directly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/community" className="bg-background text-foreground hover:bg-background/90 px-8 py-3 rounded-md font-bold transition-colors">
                Join Discord
              </Link>
              <Link href="/support" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 px-8 py-3 rounded-md font-bold transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
