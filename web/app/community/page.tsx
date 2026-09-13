import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MessagesSquare, Github, Twitter, MapPin, Users, HeartHandshake, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CommunityPage() {
  const events = [
    { title: "FHIR Connectathon India 2025", date: "Nov 15-16, 2025", location: "Bengaluru & Online", type: "Conference" },
    { title: "Building with ABDM: A Developer Workshop", date: "Oct 28, 2025", location: "Online", type: "Webinar" },
    { title: "OneHealth Open Source Hackathon", date: "Dec 5-7, 2025", location: "Online", type: "Hackathon" }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-20 text-center max-w-3xl mx-auto space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-6">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Join the Community
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect with thousands of developers, clinicians, and health-tech enthusiasts building the future of healthcare on OneHealth.
          </p>
        </header>

        {/* Community Channels */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 grid md:grid-cols-3 gap-8 mb-24">
          <a href="#" className="bg-card border border-border p-8 rounded-2xl hover:border-[#5865F2] hover:shadow-md transition-all group text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#5865F2]/10 rounded-full flex items-center justify-center group-hover:bg-[#5865F2] transition-colors">
              <MessagesSquare className="w-8 h-8 text-[#5865F2] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold">Discord Server</h3>
            <p className="text-muted-foreground">Real-time chat with the OneHealth engineering team and community developers.</p>
            <span className="text-[#5865F2] font-medium mt-auto flex items-center gap-2">Join Discord <ArrowRight className="w-4 h-4" /></span>
          </a>

          <a href="#" className="bg-card border border-border p-8 rounded-2xl hover:border-foreground hover:shadow-md transition-all group text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center group-hover:bg-foreground transition-colors">
              <Github className="w-8 h-8 text-foreground group-hover:text-background transition-colors" />
            </div>
            <h3 className="text-xl font-bold">GitHub Discussions</h3>
            <p className="text-muted-foreground">Deep technical discussions, feature requests, and open-source contributions.</p>
            <span className="text-foreground font-medium mt-auto flex items-center gap-2">View GitHub <ArrowRight className="w-4 h-4" /></span>
          </a>

          <a href="#" className="bg-card border border-border p-8 rounded-2xl hover:border-[#1DA1F2] hover:shadow-md transition-all group text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center group-hover:bg-[#1DA1F2] transition-colors">
              <Twitter className="w-8 h-8 text-[#1DA1F2] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold">Twitter / X</h3>
            <p className="text-muted-foreground">Follow us for the latest platform updates, server status, and community highlights.</p>
            <span className="text-[#1DA1F2] font-medium mt-auto flex items-center gap-2">Follow @OneHealth <ArrowRight className="w-4 h-4" /></span>
          </a>
        </div>

        {/* Upcoming Events */}
        <section className="bg-muted/30 py-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <p className="text-lg text-muted-foreground">Meet the team and learn how to leverage ABDM in your applications.</p>
            </div>
            
            <div className="space-y-4">
              {events.map((event, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-card border border-border rounded-xl hover:shadow-sm transition-all gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-primary font-medium">
                      <span>{event.date}</span>
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden md:inline-block bg-muted px-3 py-1 rounded text-sm font-medium">{event.type}</span>
                    <button className="px-6 py-2 bg-background border border-border hover:bg-muted rounded-md text-sm font-medium transition-colors">
                      RSVP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
