import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ShieldCheck, Lock, Server, Fingerprint, Activity, FileKey, CheckCircle2 } from "lucide-react";

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Security at OneHealth
            </h1>
            <p className="text-xl text-muted-foreground">
              We protect the healthcare data of millions of Indians. Security isn't just a feature—it's the foundational architecture of everything we build.
            </p>
          </header>

          {/* Core Pillars */}
          <section className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <Lock className="w-8 h-8 text-secondary" />
              <h3 className="text-xl font-bold">Zero Trust Architecture</h3>
              <p className="text-muted-foreground leading-relaxed">
                We operate on a "never trust, always verify" model. Every request, whether external or internal, is authenticated, authorized, and continuously validated before access is granted.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <FileKey className="w-8 h-8 text-secondary" />
              <h3 className="text-xl font-bold">End-to-End Encryption</h3>
              <p className="text-muted-foreground leading-relaxed">
                All Personal Health Information (PHI) is encrypted at rest using AES-256 and in transit using TLS 1.3. Cryptographic keys are managed via hardware security modules (HSMs).
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <Fingerprint className="w-8 h-8 text-secondary" />
              <h3 className="text-xl font-bold">Privacy by Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Biometric data is instantly hashed and irreversibly anonymized. Our ABHA integration ensures that patients retain granular, revocable consent over every piece of their clinical history.
              </p>
            </div>
          </section>

          {/* Detailed Content Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-4xl mx-auto space-y-12 text-foreground/90">
            
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Infrastructure Security</h2>
              <p>
                Our cloud infrastructure is hosted in top-tier, ISO 27001-certified data centers located strictly within India to comply with local data localization mandates (as per the DPDP Act and ABDM guidelines). 
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">Network Isolation</strong>
                    <span className="text-sm">Databases and internal microservices run within private VPCs, completely isolated from the public internet.</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">DDoS Protection</strong>
                    <span className="text-sm">Enterprise-grade Web Application Firewalls (WAF) and distributed denial-of-service mitigation shield our endpoints.</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">Automated Vulnerability Scanning</strong>
                    <span className="text-sm">Continuous CI/CD pipeline scanning for dependencies, SAST, and DAST to catch vulnerabilities before deployment.</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">Immutable Audit Logs</strong>
                    <span className="text-sm">Every API request, especially those interacting with PHI, is logged immutably for forensic analysis.</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Application Security & FHIR</h2>
              <p>
                OneHealth is built on the HL7 FHIR R4 standard. Securing healthcare data requires strict adherence to industry-specific interoperability security profiles.
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>SMART on FHIR:</strong> We utilize OAuth 2.0 and OpenID Connect protocols as defined by the SMART on FHIR specification, ensuring secure, delegated authorization for third-party apps and healthcare providers.</li>
                <li><strong>ABDM Consent Artefacts:</strong> Access to a patient's health records requires a digitally signed Consent Artefact. Our Health Information Provider (HIP) module rigorously validates the cryptographic signature of the Consent Manager before releasing any data.</li>
                <li><strong>Rate Limiting & Abuse Prevention:</strong> AI-driven anomaly detection monitors traffic patterns, enforcing strict rate limits and automatically blocking suspicious IPs or irregular access patterns.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Compliance & Certifications</h2>
              <p>
                We continuously audit our systems against the most stringent global and domestic healthcare standards.
              </p>
              <div className="bg-muted p-8 rounded-xl border border-border">
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <Server className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-lg">ISO/IEC 27001:2022</strong>
                      <p className="text-sm text-muted-foreground mt-1">Our Information Security Management System (ISMS) is certified by independent auditors.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Activity className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-lg">ABDM Milestone 1, 2 & 3 Certified</strong>
                      <p className="text-sm text-muted-foreground mt-1">Officially empaneled by the National Health Authority (NHA) as a certified HIP, HIU, and PHR application.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-lg">HIPAA Alignment</strong>
                      <p className="text-sm text-muted-foreground mt-1">While operating in India, our system architectures align with the US Health Insurance Portability and Accountability Act (HIPAA) Security Rule for defense-in-depth.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Vulnerability Disclosure Program</h2>
              <p>
                We believe that collaborating with the global security research community is crucial to maintaining the highest security standards. If you believe you have found a security vulnerability in OneHealth, please report it to us immediately.
              </p>
              <p>
                Please email your findings to <strong>security@onehealth.example.com</strong>. We ask that you provide detailed steps to reproduce the vulnerability and allow us reasonable time to remediate the issue before public disclosure.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
