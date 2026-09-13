import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Shield, Activity, Network, FileText, CheckSquare, Verified } from "lucide-react";

export default function ABDMCompliancePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-blue-500/10 flex items-center justify-center rounded-full mb-6">
              <Verified className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              ABDM Compliance & Integration
            </h1>
            <p className="text-xl text-muted-foreground">
              OneHealth is deeply integrated into the Ayushman Bharat Digital Mission (ABDM) architecture, driving a unified and interoperable digital health ecosystem across India.
            </p>
          </header>

          {/* Overview Architecture */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm space-y-8">
            <h2 className="text-2xl font-bold text-center">Our Role in the ABDM Ecosystem</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4 p-6 bg-muted/50 rounded-xl">
                <Network className="w-10 h-10 text-primary" />
                <h3 className="text-lg font-semibold">Health Information Provider (HIP)</h3>
                <p className="text-sm text-muted-foreground">
                  Hospitals using OneHealth securely generate and share FHIR-compliant clinical records (prescriptions, diagnostic reports) with the ABDM network upon patient consent.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 bg-muted/50 rounded-xl">
                <FileText className="w-10 h-10 text-primary" />
                <h3 className="text-lg font-semibold">Health Information User (HIU)</h3>
                <p className="text-sm text-muted-foreground">
                  Doctors can request longitudinal health histories from other hospitals across India, viewing a complete patient timeline to make safer medical decisions.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 bg-muted/50 rounded-xl">
                <Shield className="w-10 h-10 text-primary" />
                <h3 className="text-lg font-semibold">Personal Health Record (PHR)</h3>
                <p className="text-sm text-muted-foreground">
                  Patients use our mobile-first PWA to view their health records, manage consent artefacts, and link their ABHA ID seamlessly.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Content Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-4xl mx-auto space-y-12 text-foreground/90">
            
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">ABDM Milestone Certifications</h2>
              <p>
                The National Health Authority (NHA) strictly regulates the ABDM sandbox and production environments. OneHealth has successfully cleared all rigorous testing milestones:
              </p>
              <ul className="list-none space-y-4 pl-0">
                <li className="flex items-start gap-3">
                  <CheckSquare className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground text-lg">Milestone 1: ABHA Creation and Capture</strong>
                    <p className="text-muted-foreground">We facilitate real-time creation of ABHA (Ayushman Bharat Health Account) numbers via Aadhaar OTP and demographic authentication. We also support ABHA address (name@abdm) generation and seamless linking to local hospital MRNs (Medical Record Numbers).</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckSquare className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground text-lg">Milestone 2: Health Information Provider (HIP)</strong>
                    <p className="text-muted-foreground">OneHealth correctly packages clinical data into FHIR R4 standard profiles. We respond to data discovery requests, securely link care contexts, and encrypt payloads using Elliptic-curve Diffie–Hellman (ECDH) key exchange before transmitting them over the Health Information Exchange and Consent Manager (HIE-CM).</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckSquare className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground text-lg">Milestone 3: Health Information User (HIU)</strong>
                    <p className="text-muted-foreground">Our platform allows doctors to initiate consent requests. Once the patient approves via their PHR app, OneHealth retrieves the encrypted data blocks from various HIPs across India, decrypts them securely using our private keys, and presents a unified clinical timeline.</p>
                  </div>
                </li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Consent Management Architecture</h2>
              <p>
                In the ABDM framework, the patient is the absolute owner of their health data. OneHealth enforces this through a strict consent-driven architecture.
              </p>
              <p>
                When a doctor requests your previous medical history, a <strong>Consent Artefact Request</strong> is generated. This request details:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Purpose of Request:</strong> (e.g., Care Management, Emergency).</li>
                <li><strong>Information Type:</strong> (e.g., Prescriptions, Diagnostic Reports, Discharge Summaries).</li>
                <li><strong>Data Period:</strong> The specific timeframe of the records requested.</li>
                <li><strong>Consent Expiry:</strong> How long the doctor is permitted to view the data.</li>
              </ul>
              <p>
                Data is only transferred over the network once the patient digitally signs the Consent Artefact. OneHealth supports both asynchronous consent (push notifications to the patient's phone) and synchronous consent (using OTPs at the registration desk).
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Data Privacy & Security Protocols</h2>
              <p>
                Under ABDM, no health data is stored centrally by the government. The architecture is entirely federated.
              </p>
              <p>
                When data is shared between a HIP and a HIU, it flows through the ABDM Gateway. However, the data payload itself is heavily encrypted. The ABDM Gateway and the Consent Manager act as blind routers—they cannot read the health data.
              </p>
              <p>
                OneHealth generates a unique, ephemeral ECDH (Elliptic-curve Diffie–Hellman) key pair for every single data transfer. The sending hospital encrypts the data using a shared secret derived from the receiving doctor's public key. The data remains encrypted until it reaches the OneHealth HIU server, where it is decrypted and temporarily cached solely for the purpose of the doctor's consultation, strictly abiding by the DPDP Act.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
