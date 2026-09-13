import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Newspaper, ArrowRight, Download, Mail } from "lucide-react";
import Link from "next/link";

export default function PressPage() {
  const pressReleases = [
    {
      date: "October 5, 2025",
      title: "OneHealth Announces $25M Series B to Scale ABDM Integration Nationwide",
      outlet: "Press Release"
    },
    {
      date: "September 12, 2025",
      title: "National Health Authority Empanels OneHealth as Official PHR Partner",
      outlet: "Press Release"
    },
    {
      date: "August 20, 2025",
      title: "OneHealth Surpasses 5 Million ABHA IDs Created via its Platform",
      outlet: "Press Release"
    }
  ];

  const newsCoverage = [
    {
      date: "Oct 8, 2025",
      title: "How Startups are Building on India's Digital Health Stack",
      outlet: "TechCrunch",
      type: "Article"
    },
    {
      date: "Sep 25, 2025",
      title: "The Future of Interoperable Healthcare in India",
      outlet: "The Economic Times",
      type: "Interview"
    },
    {
      date: "Aug 05, 2025",
      title: "OneHealth CEO Dr. Aditi Sharma on the Power of Federated Health Records",
      outlet: "CNBC TV18",
      type: "Video"
    }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-20 text-center max-w-3xl mx-auto space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-6">
            <Newspaper className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Press & Media
          </h1>
          <p className="text-xl text-muted-foreground">
            Latest news, press releases, and media resources for OneHealth.
          </p>
        </header>

        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 grid md:grid-cols-3 gap-12">
          
          {/* Left Column (Content) */}
          <div className="md:col-span-2 space-y-16">
            
            {/* Press Releases */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-border pb-2">Recent Press Releases</h2>
              <div className="space-y-4">
                {pressReleases.map((pr, i) => (
                  <div key={i} className="group p-6 bg-card border border-border rounded-xl hover:shadow-sm hover:border-primary/50 transition-all">
                    <p className="text-sm text-primary font-medium mb-2">{pr.date}</p>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{pr.title}</h3>
                    <Link href="#" className="inline-flex items-center gap-2 text-sm text-muted-foreground mt-4 hover:text-foreground">
                      Read full release <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Media Coverage */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-border pb-2">OneHealth in the News</h2>
              <div className="space-y-4">
                {newsCoverage.map((news, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-card border border-border rounded-xl hover:shadow-sm transition-all gap-4">
                    <div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">{news.outlet}</span>
                        <span>·</span>
                        <span>{news.date}</span>
                        <span>·</span>
                        <span className="bg-muted px-2 py-0.5 rounded text-xs">{news.type}</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{news.title}</h3>
                    </div>
                    <Link href="#" className="shrink-0 p-3 bg-muted rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8">
            
            <div className="bg-muted/30 border border-border p-6 rounded-xl space-y-6">
              <h3 className="font-bold text-lg">Media Contacts</h3>
              <p className="text-sm text-muted-foreground">
                For press inquiries, interview requests, or speaker invitations, please contact our PR team.
              </p>
              <a href="mailto:press@onehealth.example.com" className="flex items-center gap-3 text-sm font-medium text-primary hover:underline">
                <Mail className="w-4 h-4" /> press@onehealth.example.com
              </a>
            </div>

            <div className="bg-muted/30 border border-border p-6 rounded-xl space-y-6">
              <h3 className="font-bold text-lg">Brand Assets</h3>
              <p className="text-sm text-muted-foreground">
                Download official OneHealth logos, product screenshots, and executive headshots.
              </p>
              <button className="w-full flex items-center justify-center gap-2 bg-background border border-border text-foreground hover:bg-muted py-2.5 rounded-md text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Download Media Kit (ZIP)
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Please review our <Link href="/brand-guidelines" className="underline">brand guidelines</Link> before use.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
