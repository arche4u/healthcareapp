import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LifeBuoy, BookOpen, MessageCircle, PhoneCall, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const faqs = [
    { q: "How do I reset my hospital admin password?", a: "Go to the login screen and click 'Forgot Password'. You will need access to the email address registered with your admin account." },
    { q: "Why is the ABHA OTP not being received?", a: "This usually happens if the Aadhaar-linked mobile number is inactive or due to UIDAI server delays. Ask the patient to verify their Aadhaar linked number." },
    { q: "How do I integrate my existing LIS (Lab Info System)?", a: "We provide secure REST endpoints to push diagnostic reports. Please refer to our Developer Portal for the LIS Integration Guide." },
    { q: "What should I do if a patient revokes consent?", a: "If a patient revokes a consent artefact, your access to their past longitudinal records will immediately cease. However, any local encounter data generated at your specific hospital remains available to you as per standard data retention policies." }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-20 text-center max-w-3xl mx-auto space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-6">
            <LifeBuoy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            How can we help?
          </h1>
          <p className="text-xl text-muted-foreground">
            Whether you're a doctor, a hospital administrator, or an API developer, our support team is here for you.
          </p>
          
          <div className="max-w-xl mx-auto relative mt-8">
            <input 
              type="text" 
              placeholder="Search help articles..." 
              className="w-full bg-background border border-border rounded-xl py-4 px-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground text-center"
            />
          </div>
        </header>

        {/* Support Channels */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 grid md:grid-cols-3 gap-8 mb-24">
          <Link href="/docs" className="bg-card border border-border p-8 rounded-2xl hover:border-primary/50 hover:shadow-md transition-all group text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <BookOpen className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold">Documentation</h3>
            <p className="text-muted-foreground">Detailed guides, API references, and step-by-step tutorials.</p>
            <span className="text-blue-500 font-medium mt-auto flex items-center gap-2">Browse Docs <ArrowRight className="w-4 h-4" /></span>
          </Link>

          <a href="mailto:support@onehealth.example.com" className="bg-card border border-border p-8 rounded-2xl hover:border-green-500/50 hover:shadow-md transition-all group text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <Mail className="w-8 h-8 text-green-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold">Email Support</h3>
            <p className="text-muted-foreground">Create a support ticket. We typically respond within 2-4 hours.</p>
            <span className="text-green-500 font-medium mt-auto flex items-center gap-2">Send Email <ArrowRight className="w-4 h-4" /></span>
          </a>

          <a href="tel:18001234567" className="bg-card border border-border p-8 rounded-2xl hover:border-purple-500/50 hover:shadow-md transition-all group text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-colors">
              <PhoneCall className="w-8 h-8 text-purple-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold">24/7 Phone Support</h3>
            <p className="text-muted-foreground">For critical clinical down-time or urgent infrastructure issues.</p>
            <span className="text-purple-500 font-medium mt-auto flex items-center gap-2">Call 1800-123-4567 <ArrowRight className="w-4 h-4" /></span>
          </a>
        </div>

        {/* FAQs */}
        <section className="bg-muted/30 py-24 px-4 md:px-8 lg:px-16 border-t border-border">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <h4 className="text-lg font-bold text-foreground mb-3">{faq.q}</h4>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-8">
              <Link href="/faq" className="text-primary font-bold hover:underline">
                View all FAQs
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
