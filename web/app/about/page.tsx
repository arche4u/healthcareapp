import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HeartPulse, Globe2, Users, ShieldAlert, Award, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Hero Section */}
        <section className="px-4 md:px-8 lg:px-16 mb-20 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Our Mission
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Building the Digital Backbone of <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Indian Healthcare</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            OneHealth is on a mission to democratize access to quality healthcare by building unified, interoperable, and AI-powered digital infrastructure. We believe that health data belongs to the patient, and technology should empower doctors, not burden them.
          </p>
        </section>

        {/* The Problem & Solution */}
        <section className="bg-muted/30 py-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">The Fragmentation Crisis</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                For decades, Indian healthcare has operated in silos. A patient's medical history is scattered across dozens of hospitals, clinics, and diagnostic centers, locked in proprietary systems or physical paper files. 
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                When an emergency strikes, doctors are forced to make critical decisions with incomplete information. Tests are duplicated, treatments are delayed, and patient outcomes suffer. This fragmentation isn't just inefficient—it's dangerous.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-2xl shadow-lg space-y-6">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Globe2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">The OneHealth Solution</h3>
              <p className="text-muted-foreground leading-relaxed">
                We built OneHealth to solve this. By embracing the Ayushman Bharat Digital Mission (ABDM) and the HL7 FHIR standard, we create a unified health record for every Indian. 
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our platform acts as a secure bridge, allowing a doctor in Mumbai to instantly (and with consent) view an MRI scan done in a rural clinic in Bihar. We replace silos with a connected, patient-centric ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24 px-4 md:px-8 lg:px-16 max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Our Core Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These principles guide every line of code we write and every product decision we make.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Patient Sovereignty</h3>
              <p className="text-muted-foreground">
                Data belongs to the patient. We build systems that give individuals absolute control and granular consent over who sees their medical history.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Uncompromising Security</h3>
              <p className="text-muted-foreground">
                In healthcare, security is life-critical. We employ zero-trust architectures and end-to-end encryption to protect sensitive data at all costs.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Doctor Empowerment</h3>
              <p className="text-muted-foreground">
                Technology should reduce burnout, not cause it. Our UX is designed by clinicians, for clinicians, to get out of the way and let doctors heal.
              </p>
            </div>
          </div>
        </section>

        {/* Leadership Team (Dummy Data) */}
        <section className="bg-muted/30 py-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Leadership Team</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built by a team of doctors, engineers, and healthcare policy experts.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {[
                { name: "Rama Krishna", role: "CTO", exp: "SS innovations inc" },
                { name: "Malladi Vishwanath Tanmai", role: "Developer", exp: "OneHealth" },
              ].map((leader, i) => (
                <div key={i} className="bg-card border border-border p-6 rounded-xl text-center space-y-4">
                  <div className="w-24 h-24 bg-muted rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {leader.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{leader.name}</h4>
                    <p className="text-primary text-sm font-medium">{leader.role}</p>
                    <p className="text-xs text-muted-foreground mt-2">{leader.exp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestones / Timeline */}
        <section className="py-24 px-4 md:px-8 lg:px-16 max-w-4xl mx-auto space-y-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Our Journey</h2>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <Award className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-foreground">Founded OneHealth</div>
                  <time className="font-caveat font-medium text-primary">Jan 2026</time>
                </div>
                <div className="text-sm text-muted-foreground">Started with a mission to solve India's healthcare fragmentation.</div>
              </div>
            </div>
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-foreground">ABDM M1 & M2 Certified</div>
                  <time className="font-caveat font-medium text-primary">May 2026</time>
                </div>
                <div className="text-sm text-muted-foreground">Officially recognized by the National Health Authority as a HIP and HIU.</div>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-foreground">100th Hospital Onboarded</div>
                  <time className="font-caveat font-medium text-primary">Nov 2026</time>
                </div>
                <div className="text-sm text-muted-foreground">Reached a major milestone, processing over 10,000 daily encounters.</div>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
