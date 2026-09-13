import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FileJson, Database, Workflow, CheckCircle, Flame } from "lucide-react";

export default function FHIRCompliancePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-red-500/10 flex items-center justify-center rounded-full mb-6">
              <Flame className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              FHIR R4 Native Architecture
            </h1>
            <p className="text-xl text-muted-foreground">
              OneHealth isn't just "FHIR-compatible." It is FHIR-native. From our underlying database schema to our API transport layer, everything speaks Fast Healthcare Interoperability Resources (HL7 FHIR Release 4).
            </p>
          </header>

          {/* Core Pillars */}
          <section className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <Database className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-bold">Native Storage</h3>
              <p className="text-muted-foreground leading-relaxed">
                We store clinical data natively as FHIR JSON documents within PostgreSQL using optimized JSONB columns, eliminating the need for brittle ETL translations.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <FileJson className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-bold">Standardized Profiles</h3>
              <p className="text-muted-foreground leading-relaxed">
                We strictly adhere to the National Resource Center for EHR Standards (NRCeS) profiles tailored for India, ensuring perfect compatibility with ABDM.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <Workflow className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-bold">Clinical Terminologies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Full support for SNOMED CT for clinical findings, LOINC for observations and diagnostics, and ICD-10 for disease classification.
              </p>
            </div>
          </section>

          {/* Detailed Content Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-4xl mx-auto space-y-12 text-foreground/90">
            
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Why FHIR Matters</h2>
              <p>
                Historically, healthcare data has been trapped in proprietary, siloed silos. A hospital using System A could not easily share a patient's lab results with a hospital using System B. HL7 FHIR solves this by defining a standardized set of "Resources" (e.g., Patient, Encounter, Observation, MedicationRequest) and a RESTful API specification for exchanging them.
              </p>
              <p>
                Because OneHealth is built on FHIR R4 from the ground up, interoperability isn't an afterthought—it's built in.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">Supported FHIR Resources</h2>
              <p>
                Our system extensively utilizes the following FHIR R4 resources to map the clinical journey:
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mt-6">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Administrative
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                    <li><code>Patient</code>: Demographics and identifiers.</li>
                    <li><code>Practitioner</code>: Doctors and clinical staff.</li>
                    <li><code>Organization</code>: Hospitals and clinics.</li>
                    <li><code>Encounter</code>: A specific visit or admission.</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Clinical
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                    <li><code>Observation</code>: Vitals, lab results, and social history.</li>
                    <li><code>Condition</code>: Diagnoses and problems.</li>
                    <li><code>MedicationRequest</code>: Prescriptions and orders.</li>
                    <li><code>DiagnosticReport</code>: Aggregated lab and imaging reports.</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Security & Infrastructure
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                    <li><code>Consent</code>: Digital consent artefacts.</li>
                    <li><code>DocumentReference</code>: Attached PDFs and imaging (DICOM).</li>
                    <li><code>Bundle</code>: Packaging multiple resources for HIE transfer.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">ABDM NDHM Profiles</h2>
              <p>
                While FHIR is a global standard, the National Digital Health Mission (NDHM) of India defines specific "Profiles" (constraints and extensions) to suit the Indian context. OneHealth rigorously validates all FHIR bundles against the NDHM Implementation Guide.
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Identifiers:</strong> We enforce the use of the NDHM System URIs for identifiers (e.g., <code>https://ndhm.gov.in/Id/abha</code> for Patient ABHA).</li>
                <li><strong>Extensions:</strong> We implement custom NDHM extensions, such as capturing a patient's religion or caste, strictly conforming to the defined ValueSets.</li>
                <li><strong>Bundling:</strong> When a doctor finalizes a consultation, the system generates a standard NDHM <code>OPConsultRecord</code> Bundle. This structured bundle contains the Encounter, Condition, MedicationRequest, and DocumentReference resources, cryptographically signed and ready for ABDM transfer.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-border pb-2">SMART on FHIR</h2>
              <p>
                We are laying the groundwork to support the SMART on FHIR specification. This will allow authorized third-party health applications (e.g., diet trackers, specialized clinical decision support systems) to securely connect to the OneHealth API using OAuth 2.0, providing unprecedented extensibility for our hospital partners.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
