import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </header>

          {/* Content Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">1. Introduction and Scope</h2>
              <p>
                Welcome to OneHealth ("we", "our", or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy applies to our website, mobile applications, and all related services, tools, and platforms (collectively, the "Services") that link to this policy. 
              </p>
              <p>
                As a unified, patient-centric care platform operating within India, we adhere strictly to the Digital Personal Data Protection Act (DPDP Act), the Information Technology Act, 2000, and guidelines established under the Ayushman Bharat Digital Mission (ABDM). We recognize the extreme sensitivity of health-related data (Personal Health Information or PHI) and employ the highest standards of data minimization, encryption, and consent management.
              </p>
              <p>
                Please read this Privacy Policy carefully to understand our policies and practices regarding your information and how we will treat it. If you do not agree with our policies and practices, your choice is not to use our Services. By accessing or using our Services, you agree to this Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">2. Information We Collect</h2>
              <p>
                We collect several types of information from and about users of our Services, heavily focusing on data necessary to provide healthcare services and facilitate interoperability via ABDM.
              </p>
              
              <h3 className="text-xl font-semibold mt-6">2.1 Personal Identification Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Data:</strong> First name, last name, date of birth, gender, marital status, and government-issued identifiers such as Aadhaar number (only when explicitly provided and consented to for ABHA creation).</li>
                <li><strong>Contact Data:</strong> Residential address, email address, and telephone numbers.</li>
                <li><strong>ABHA (Ayushman Bharat Health Account) Details:</strong> Your 14-digit ABHA number and ABHA address (e.g., name@abdm).</li>
                <li><strong>Biometric Data:</strong> Facial recognition templates and fingerprint hashes, collected exclusively with explicit consent for secure check-in and identity verification at participating healthcare facilities.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">2.2 Personal Health Information (PHI)</h3>
              <p>
                When you use our Services to manage your health or interact with healthcare providers, we collect and process:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Clinical Records:</strong> Encounter details, diagnoses (ICD-10/SNOMED CT), treatment plans, clinical notes, and discharge summaries.</li>
                <li><strong>Diagnostic Data:</strong> Laboratory results, imaging reports, and pathology findings.</li>
                <li><strong>Medication Data:</strong> Prescriptions, medication history, and pharmacy fulfillment records.</li>
                <li><strong>Vitals and Observations:</strong> Blood pressure, heart rate, temperature, weight, and self-reported symptom intake data.</li>
                <li><strong>Consent Artifacts:</strong> Cryptographically signed digital consents managing who can access your health records across the ABDM network.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">2.3 Technical and Usage Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, unique device identifiers, and mobile network information.</li>
                <li><strong>Usage Details:</strong> Details of your visits to our Services, including traffic data, location data, logs, and other communication data and the resources that you access and use on the Services.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and other tracking technologies to collect information about your interactions with our platform. You can control cookie settings through your browser.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">3. How We Use Your Information</h2>
              <p>
                We use information that we collect about you or that you provide to us, including any personal information, strictly for the following purposes:
              </p>
              <ul className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>To Provide and Maintain our Services:</strong> Including facilitating patient registration, appointment scheduling, teleconsultations, and seamless data exchange between hospitals.
                </li>
                <li>
                  <strong>To Ensure Clinical Accuracy and Patient Safety:</strong> By providing your doctors and nurses with accurate, up-to-date health records (subject to your consent) to make informed medical decisions.
                </li>
                <li>
                  <strong>For ABDM Integration:</strong> To create and manage your ABHA ID, link your health records to your ABHA, and facilitate the secure sharing of records with other ABDM-registered healthcare providers via the Health Information Exchange and Consent Manager (HIE-CM).
                </li>
                <li>
                  <strong>For AI-Powered Insights:</strong> To power our clinical decision support systems, AI triage, and predictive analytics (e.g., ICU readmission risk). <em>Note: AI models are trained on heavily de-identified and aggregated data unless explicit consent is provided for personalized AI analysis.</em>
                </li>
                <li>
                  <strong>To Process Payments:</strong> To process transactions, billing, and insurance claims.
                </li>
                <li>
                  <strong>To Communicate With You:</strong> To send you appointment reminders, clinical alerts, platform updates, and respond to your inquiries.
                </li>
                <li>
                  <strong>For Security and Fraud Prevention:</strong> To monitor for unusual activity, prevent unauthorized access (e.g., using biometric verification), and enforce our Terms of Service.
                </li>
                <li>
                  <strong>For Compliance and Legal Obligations:</strong> To comply with applicable laws, regulations, court orders, and government requests, including public health reporting requirements.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">4. Data Sharing and Disclosure</h2>
              <p>
                Your privacy is paramount. We do not sell, rent, or trade your personal health information to third parties for marketing purposes. We only share your data under the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold mt-4">4.1 With Healthcare Providers (With Consent)</h3>
              <p>
                Through the ABDM framework, you have granular control over who accesses your data. We share your PHI with doctors, hospitals, and diagnostic centers <strong>only when you explicitly grant a Consent Artifact</strong>. You can revoke this consent at any time via the patient portal.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.2 With Service Providers</h3>
              <p>
                We may share information with trusted third-party vendors, consultants, and service providers who need access to such information to carry out work on our behalf (e.g., cloud hosting via AWS/GCP, SMS delivery gateways). These providers are bound by strict Business Associate Agreements (BAAs) and confidentiality clauses.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.3 For Legal and Regulatory Requirements</h3>
              <p>
                We may disclose your information if required to do so by law or in the good-faith belief that such action is necessary to comply with state and federal laws (such as reporting infectious diseases to the Ministry of Health and Family Welfare), or to respond to a court order, judicial or other government subpoena, or warrant.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.4 In Corporate Transactions</h3>
              <p>
                If OneHealth is involved in a merger, acquisition, or asset sale, your personal information may be transferred. We will provide notice before your personal information is transferred and becomes subject to a different Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">5. Data Security and Encryption</h2>
              <p>
                We have implemented robust, industry-leading technical and organizational measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers, and between our servers and the ABDM network, is encrypted using TLS 1.3.</li>
                <li><strong>Encryption at Rest:</strong> All databases and storage volumes containing PHI are encrypted at rest using AES-256 encryption.</li>
                <li><strong>Access Controls:</strong> We implement strict Role-Based Access Control (RBAC). Only authorized healthcare professionals directly involved in your care (and authorized by you) can access your unencrypted health records.</li>
                <li><strong>Audit Trails:</strong> Every access, modification, or sharing of a health record is immutably logged. You can view these access logs in your patient portal.</li>
                <li><strong>Biometric Security:</strong> Biometric data (face/fingerprint) is never stored as raw images. It is immediately converted into non-reversible mathematical hashes.</li>
              </ul>
              <p className="text-sm text-muted-foreground italic mt-4">
                However, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Services. Any transmission of personal information is at your own risk.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">6. Your Data Privacy Rights</h2>
              <p>
                Under the Digital Personal Data Protection Act (DPDP Act) and ABDM guidelines, you possess significant rights regarding your data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Access:</strong> You have the right to request access to and receive a copy of your personal data and health records in a structured, commonly used, and machine-readable format (FHIR JSON).</li>
                <li><strong>Right to Correction:</strong> You can request the correction of inaccurate or incomplete personal data. (Note: Clinical records may require the amending doctor's authorization).</li>
                <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You may request the deletion of your personal data. We will comply unless we are legally required to retain it (e.g., mandatory medical record retention laws).</li>
                <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent for data sharing at any time via the ABDM Consent Manager interface in your dashboard. Withdrawal will not affect the lawfulness of processing based on consent before its withdrawal.</li>
                <li><strong>Right to Nominate:</strong> You can nominate an individual to exercise your rights on your behalf in the event of your death or incapacity.</li>
                <li><strong>Right to Grievance Redressal:</strong> You have the right to readily available means of registering a grievance with our Data Protection Officer.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact our Data Protection Officer using the information provided in Section 10.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">7. Data Retention</h2>
              <p>
                We retain your personal information and health records only for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.
              </p>
              <p>
                In India, clinical records are typically required to be retained for a minimum period (e.g., 3 years for out-patient records, longer for in-patient and medico-legal cases) as per the Clinical Establishments Act and NMC guidelines. Once the retention period expires, your data will be securely deleted or irreversibly anonymized.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">8. Children's Privacy</h2>
              <p>
                Our Services are not directly intended for use by children under the age of 18 without parental consent. We do not knowingly collect personal information directly from children. If you are under 18, you must use our Services through a parent or legal guardian's account (via the ABDM linked health records feature). If we become aware that we have collected personal data from a child without verifiable parental consent, we will take steps to remove that information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">9. Changes to Our Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, and other factors. If we make material changes to how we treat our users' personal information, we will notify you through a notice on the Services home page and/or via email to the primary email address specified in your account. The date the Privacy Policy was last revised is identified at the top of the page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">10. Contact Information and Grievance Officer</h2>
              <p>
                If you have any questions, concerns, or complaints about this Privacy Policy or our privacy practices, or if you wish to exercise your data rights, please contact our Grievance Officer / Data Protection Officer at:
              </p>
              <div className="bg-muted p-6 rounded-lg mt-4">
                <p><strong>Name:</strong> Dr. Vikram Sharma, Chief Information Security Officer (CISO)</p>
                <p><strong>Email:</strong> privacy@onehealth.example.com</p>
                <p><strong>Phone:</strong> +91-1800-123-4567 (Toll-Free)</p>
                <p><strong>Address:</strong> OneHealth Technologies Pvt. Ltd., Cyber City, DLF Phase 2, Gurugram, Haryana 122002, India</p>
              </div>
              <p className="mt-4">
                We aim to resolve all grievances within 15 days of receipt, in accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
