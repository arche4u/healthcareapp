import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </header>

          {/* Content Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">1. Acceptance of Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you (whether personally or on behalf of an entity) and OneHealth Technologies Pvt. Ltd. ("OneHealth", "we", "us", or "our"), concerning your access to and use of the OneHealth website, mobile applications, and any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Platform" or "Services").
              </p>
              <p>
                By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with all of these Terms, then you are expressly prohibited from using the Platform and you must discontinue use immediately.
              </p>
              <p>
                Supplemental terms and conditions or documents that may be posted on the Platform from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Terms at any time and for any reason.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">2. Description of Services</h2>
              <p>
                OneHealth is a unified, patient-centric healthcare platform designed to facilitate interoperability and streamline healthcare delivery in India. The Services include, but are not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Creation and management of Ayushman Bharat Health Accounts (ABHA).</li>
                <li>Digital health record storage, retrieval, and sharing via the ABDM Health Information Exchange and Consent Manager (HIE-CM) framework.</li>
                <li>Biometric-enabled (facial and fingerprint) check-in and queue management for hospitals and clinics.</li>
                <li>Telemedicine consultations and digital prescription management.</li>
                <li>AI-assisted triage, clinical decision support, and patient outcome predictions (intended strictly for healthcare professionals).</li>
              </ul>
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-destructive-foreground mt-4">
                <strong>IMPORTANT DISCLAIMER:</strong> OneHealth is a technology platform, NOT a healthcare provider. The Platform does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on the OneHealth Platform. In case of a medical emergency, immediately contact your local emergency services or visit the nearest hospital.
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">3. User Accounts and Registration</h2>
              <p>
                To access certain features of the Platform, you may be required to register for an account. By registering, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during the registration process, including valid identification if requesting ABHA creation.</li>
                <li>Maintain and promptly update your account information to keep it accurate, current, and complete.</li>
                <li>Maintain the security and confidentiality of your password and any biometrics linked to your account.</li>
                <li>Accept all responsibility for any and all activities that occur under your account.</li>
                <li>Notify us immediately if you discover or otherwise suspect any security breaches related to the Platform or your account.</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate your account if any information provided during the registration process or thereafter proves to be inaccurate, not current, or incomplete.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">4. ABDM Compliance and Consent Framework</h2>
              <p>
                OneHealth operates in strict compliance with the Ayushman Bharat Digital Mission (ABDM) guidelines.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Data Sharing:</strong> Health data is shared across the ABDM network only upon the explicit creation of a Consent Artefact by the patient or their authorized nominee.</li>
                <li><strong>Consent Revocation:</strong> You have the right to revoke any active Consent Artefact at any time through the Platform's Consent Manager interface.</li>
                <li><strong>Data Fiduciary Role:</strong> OneHealth acts as a Health Information Provider (HIP), Health Information User (HIU), and potentially a Personal Health Records (PHR) application, depending on your interaction with the Platform. In all roles, we act strictly within the bounds of your consent.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">5. Prohibited Activities</h2>
              <p>
                You may not access or use the Platform for any purpose other than that for which we make the Platform available. The Platform may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
              </p>
              <p>As a user of the Platform, you agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Systematically retrieve data or other content from the Platform to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords or access health records belonging to others.</li>
                <li>Circumvent, disable, or otherwise interfere with security-related features of the Platform.</li>
                <li>Use any information obtained from the Platform in order to harass, abuse, or harm another person.</li>
                <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material that interferes with any party’s uninterrupted use and enjoyment of the Platform.</li>
                <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
                <li>Attempt to impersonate another user or person, or use the account or ABHA ID of another user.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">6. Intellectual Property Rights</h2>
              <p>
                Unless otherwise indicated, the Platform is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Platform (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of India, foreign jurisdictions, and international conventions.
              </p>
              <p>
                The Content and the Marks are provided on the Platform "AS IS" for your information and personal use only. Except as expressly provided in these Terms, no part of the Platform and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">7. Limitation of Liability</h2>
              <p>
                IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                Specifically concerning clinical care, OneHealth is not liable for misdiagnoses, delayed treatment, or adverse medical outcomes resulting from the use of the Platform by Healthcare Providers, nor for any errors arising from inaccuracies in data entered by the patient or other providers into the HIE-CM network.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">8. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and defined following the laws of India. OneHealth Technologies Pvt. Ltd. and yourself irrevocably consent that the courts of New Delhi, India shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
              </p>
              <p>
                To expedite resolution and control the cost of any dispute, controversy, or claim related to these Terms, any dispute brought by either you or us shall be finally and exclusively resolved by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">9. Contact Us</h2>
              <p>
                In order to resolve a complaint regarding the Platform or to receive further information regarding use of the Platform, please contact us at:
              </p>
              <div className="bg-muted p-6 rounded-lg mt-4">
                <p><strong>OneHealth Technologies Pvt. Ltd.</strong></p>
                <p>Cyber City, DLF Phase 2,</p>
                <p>Gurugram, Haryana 122002, India</p>
                <p><strong>Phone:</strong> +91-1800-123-4567</p>
                <p><strong>Email:</strong> legal@onehealth.example.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
