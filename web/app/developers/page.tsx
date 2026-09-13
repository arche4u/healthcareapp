import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TerminalSquare, Server, Blocks, Fingerprint, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Hero */}
        <section className="px-4 md:px-8 lg:px-16 mb-24 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            OneHealth Developer Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Build the Future of <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Digital Health</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Integrate your clinic, hospital software, or third-party health app with India's most robust ABDM-ready API infrastructure. Speak native FHIR R4 from day one.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/docs/api" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-bold transition-colors">
              Read API Docs
            </Link>
            <Link href="/docs" className="bg-muted hover:bg-muted/80 text-foreground px-8 py-3 rounded-md font-bold transition-colors">
              Integration Guides
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-muted/30 py-24 px-4 md:px-8 lg:px-16 border-y border-border">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-8 rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Blocks className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">GraphQL & REST APIs</h3>
              <p className="text-muted-foreground">
                Query exactly what you need with our clinical GraphQL endpoints, or stick to standard REST for authentication and ABHA linking.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">OAuth 2.0 & SMART on FHIR</h3>
              <p className="text-muted-foreground">
                Securely authenticate users and apps using industry-standard OAuth2 flows, perfectly aligned with SMART on FHIR specifications.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TerminalSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">ABDM Sandbox Ready</h3>
              <p className="text-muted-foreground">
                Test your integrations against our sandbox environment which perfectly mirrors the National Health Authority's testing infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* Code Snippet Example */}
        <section className="py-24 px-4 md:px-8 lg:px-16 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Generate ABHA in 3 Lines of Code</h2>
            <p className="text-lg text-muted-foreground">
              We abstract away the immense complexity of ABDM cryptography, key generation, and multi-step OTP flows into clean, deterministic API calls.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Aadhaar Bio/Demographic Auth</span>
              </li>
              <li className="flex items-center gap-3">
                <Server className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Automated ECDH Key Management</span>
              </li>
            </ul>
            <Link href="/docs/api" className="inline-flex items-center gap-2 text-primary font-bold hover:underline pt-4">
              View API Reference <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-[#0D1117] rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="flex items-center px-4 py-3 bg-[#161B22] border-b border-gray-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="ml-4 text-xs font-mono text-gray-400">create_abha.ts</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono text-gray-300 leading-relaxed">
<span className="text-purple-400">import</span> {"{ OneHealth }"} <span className="text-purple-400">from</span> <span className="text-green-300">'@onehealth/sdk'</span>;{'\n\n'}
<span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-blue-300">OneHealth</span>({'{'}{'\n'}
{'  '}apiKey: process.env.<span className="text-orange-300">ONEHEALTH_API_KEY</span>,{'\n'}
{'  '}environment: <span className="text-green-300">'sandbox'</span>{'\n'}
{'}'});{'\n\n'}
<span className="text-gray-500">// 1. Trigger OTP to Aadhaar registered mobile</span>{'\n'}
<span className="text-purple-400">const</span> session = <span className="text-purple-400">await</span> client.abha.<span className="text-blue-300">generateOtp</span>(<span className="text-green-300">'999999999999'</span>);{'\n\n'}
<span className="text-gray-500">// 2. Verify OTP and create ABHA</span>{'\n'}
<span className="text-purple-400">const</span> profile = <span className="text-purple-400">await</span> client.abha.<span className="text-blue-300">verifyAndCreate</span>({'{'}{'\n'}
{'  '}txnId: session.txnId,{'\n'}
{'  '}otp: <span className="text-green-300">'123456'</span>{'\n'}
{'}'});{'\n\n'}
console.<span className="text-blue-300">log</span>(profile.abhaAddress); <span className="text-gray-500">// user@abdm</span>
              </pre>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
