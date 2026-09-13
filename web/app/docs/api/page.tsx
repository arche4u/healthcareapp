import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Code2, Key, ShieldAlert, FileJson } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-[#0D1117] text-gray-300">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-12 max-w-5xl mx-auto space-y-6 pt-8">
          <div className="flex items-center gap-3 text-purple-400 mb-6">
            <Code2 className="w-6 h-6" />
            <span className="font-mono text-sm tracking-wider uppercase">REST API Reference</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            OneHealth API v2.0
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Interact programmatically with the OneHealth ecosystem. Manage ABHA linking, push clinical data, and trigger FHIR workflows.
          </p>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 hidden lg:block space-y-8 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-4">
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Getting Started</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#auth" className="text-gray-400 hover:text-white transition-colors">Authentication</a></li>
                <li><a href="#errors" className="text-gray-400 hover:text-white transition-colors">Errors & Rate Limits</a></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">ABHA (Identity)</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#generate-otp" className="text-gray-400 hover:text-white transition-colors">POST /api/identity/generate-otp</a></li>
                <li><a href="#verify-otp" className="text-gray-400 hover:text-white transition-colors">POST /api/identity/verify-otp</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">FHIR (Clinical)</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#fhir-patient" className="text-gray-400 hover:text-white transition-colors">GET /api/fhir/Patient</a></li>
                <li><a href="#fhir-encounter" className="text-gray-400 hover:text-white transition-colors">POST /api/fhir/Encounter</a></li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-16 pb-24">
            
            {/* Authentication Section */}
            <section id="auth" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
                <Key className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-white">Authentication</h2>
              </div>
              <p className="leading-relaxed">
                The OneHealth API uses OAuth 2.0 Client Credentials flow for server-to-server communication, and standard Bearer tokens (JWT) for client-side requests.
              </p>
              <div className="bg-[#161B22] p-6 rounded-xl border border-gray-800 font-mono text-sm overflow-x-auto">
                <div className="text-gray-500 mb-2">// Include your JWT in the Authorization header</div>
                <div className="text-blue-300">Authorization: <span className="text-green-300">Bearer {"<your_token_here>"}</span></div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-blue-200 text-sm">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
                <p>Never expose your Client Secret in frontend code. Always proxy requests through your own secure backend.</p>
              </div>
            </section>

            {/* Generate OTP Endpoint */}
            <section id="generate-otp" className="space-y-6 scroll-mt-24">
              <div className="border-b border-gray-800 pb-2">
                <h2 className="text-2xl font-bold text-white mb-2">Generate Aadhaar OTP</h2>
                <div className="flex items-center gap-3">
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold font-mono">POST</span>
                  <code className="text-gray-400 text-sm">/api/identity/generate-otp</code>
                </div>
              </div>
              
              <p className="leading-relaxed">
                Initiates the ABHA creation process by sending an OTP to the mobile number linked to the patient's Aadhaar card.
              </p>

              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Request Body</h4>
                <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#21262D] text-gray-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">Parameter</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      <tr>
                        <td className="px-4 py-3 font-mono text-purple-400">aadhaarNumber</td>
                        <td className="px-4 py-3 text-gray-400">string</td>
                        <td className="px-4 py-3">The 12-digit Aadhaar number of the patient. Must not contain spaces.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Response Example</h4>
                <div className="bg-[#161B22] p-6 rounded-xl border border-gray-800 font-mono text-sm overflow-x-auto">
<pre>
<span className="text-gray-400">{'{'}</span>
  <span className="text-purple-400">"success"</span>: <span className="text-orange-300">true</span>,
  <span className="text-purple-400">"txnId"</span>: <span className="text-green-300">"9f8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d"</span>,
  <span className="text-purple-400">"message"</span>: <span className="text-green-300">"OTP sent to registered mobile number ending with 8989"</span>
<span className="text-gray-400">{'}'}</span>
</pre>
                </div>
              </div>
            </section>

            {/* FHIR Encounter Endpoint */}
            <section id="fhir-encounter" className="space-y-6 scroll-mt-24">
              <div className="border-b border-gray-800 pb-2">
                <h2 className="text-2xl font-bold text-white mb-2">Create Encounter (FHIR)</h2>
                <div className="flex items-center gap-3">
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold font-mono">POST</span>
                  <code className="text-gray-400 text-sm">/api/fhir/Encounter</code>
                </div>
              </div>
              
              <p className="leading-relaxed">
                Creates a new FHIR R4 Encounter resource, representing a patient's visit to a healthcare facility. This endpoint strictly validates against the NDHM Encounter Profile.
              </p>

              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Response Example (201 Created)</h4>
                <div className="bg-[#161B22] p-6 rounded-xl border border-gray-800 font-mono text-sm overflow-x-auto relative">
                  <div className="absolute top-4 right-4">
                    <FileJson className="w-5 h-5 text-gray-500" />
                  </div>
<pre>
<span className="text-gray-400">{'{'}</span>
  <span className="text-purple-400">"resourceType"</span>: <span className="text-green-300">"Encounter"</span>,
  <span className="text-purple-400">"id"</span>: <span className="text-green-300">"enc-12345"</span>,
  <span className="text-purple-400">"status"</span>: <span className="text-green-300">"in-progress"</span>,
  <span className="text-purple-400">"class"</span>: <span className="text-gray-400">{'{'}</span>
    <span className="text-purple-400">"system"</span>: <span className="text-green-300">"http://terminology.hl7.org/CodeSystem/v3-ActCode"</span>,
    <span className="text-purple-400">"code"</span>: <span className="text-green-300">"AMB"</span>,
    <span className="text-purple-400">"display"</span>: <span className="text-green-300">"ambulatory"</span>
  <span className="text-gray-400">{'}'}</span>,
  <span className="text-purple-400">"subject"</span>: <span className="text-gray-400">{'{'}</span>
    <span className="text-purple-400">"reference"</span>: <span className="text-green-300">"Patient/pat-67890"</span>
  <span className="text-gray-400">{'}'}</span>,
  <span className="text-purple-400">"period"</span>: <span className="text-gray-400">{'{'}</span>
    <span className="text-purple-400">"start"</span>: <span className="text-green-300">"2025-10-24T09:30:00Z"</span>
  <span className="text-gray-400">{'}'}</span>
<span className="text-gray-400">{'}'}</span>
</pre>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
