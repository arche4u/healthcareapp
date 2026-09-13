import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Coffee, Code } from "lucide-react";
import Link from "next/link";

export default function CareersPage() {
  const jobs = [
    { title: "Senior Full Stack Engineer (Next.js/Python)", dept: "Engineering", location: "Gurugram / Remote", type: "Full-time" },
    { title: "FHIR Integration Specialist", dept: "Engineering", location: "Gurugram / Remote", type: "Full-time" },
    { title: "Clinical Informatics Manager", dept: "Product", location: "Gurugram", type: "Full-time" },
    { title: "Product Designer (UX/UI)", dept: "Design", location: "Remote", type: "Full-time" },
    { title: "DevSecOps Engineer", dept: "Infrastructure", location: "Gurugram", type: "Full-time" },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Hero Section */}
        <section className="px-4 md:px-8 lg:px-16 mb-24 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Join the Team
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Help Us Fix <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Healthcare</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We are looking for passionate builders who want to work on hard problems that matter. If you want your code to save lives and streamline care for millions, you belong here.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <a href="#open-roles" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
              View Open Roles
            </a>
          </div>
        </section>

        {/* Perks & Benefits */}
        <section className="bg-muted/30 py-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Why OneHealth?</h2>
              <p className="text-lg text-muted-foreground">
                We demand excellence, but we take care of our own. We offer comprehensive benefits to ensure you can do the best work of your career.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="bg-card border border-border p-6 rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Premium Healthcare</h4>
                <p className="text-sm text-muted-foreground">Top-tier medical insurance for you and your dependents, covering pre-existing conditions.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Meaningful Equity</h4>
                <p className="text-sm text-muted-foreground">We want you to be an owner. Generous ESOP grants for all full-time employees.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Flexible Time Off</h4>
                <p className="text-sm text-muted-foreground">Unlimited PTO policy. We measure output and impact, not hours spent at a desk.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Tech Stipend</h4>
                <p className="text-sm text-muted-foreground">Annual allowance for home office setup, courses, conferences, and wellness.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Roles */}
        <section id="open-roles" className="py-24 px-4 md:px-8 lg:px-16 max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Open Positions</h2>
            <p className="text-lg text-muted-foreground">Don't see a perfect fit? Send your resume to careers@onehealth.example.com</p>
          </div>

          <div className="space-y-4">
            {jobs.map((job, i) => (
              <Link href={`#`} key={i} className="group block bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all hover:border-primary/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.dept}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {job.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-start md:justify-end">
                    <span className="text-primary font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
