"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Camera,
  Mic2,
  Stethoscope,
  Pill,
  CalendarCheck,
  Smartphone,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Face Scan Check-In",
    description:
      "Patient stands in front of the camera at the front desk. Encrypted biometric template sent to Identity Service for matching.",
    details: [
      "Secure face recognition using state-of-the-art AI",
      "Data encrypted on-device — raw image never stored",
      "Fallback: ABHA address, demographic search",
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    icon: Mic2,
    title: "AI Symptom Intake",
    description:
      "Patient completes 10-question voice-first intake on PWA or front-desk tablet. Available in Hindi, Tamil, Telugu, Bengali, Marathi.",
    details: [
      "Whisper STT + AI4Bharat for regional languages",
      "Self-hosted LLM (Ollama) adapts follow-up questions",
      "Structured output auto-routed to correct specialty",
    ],
    color: "from-cyan-500 to-green-500",
  },
  {
    number: "03",
    icon: Stethoscope,
    title: "Doctor Dashboard",
    description:
      "Doctor sees pre-triaged patient queue with symptom summary, cross-hospital history, and vitals trend charts. Hospital-scoped RBAC enforced.",
    details: [
      "Next.js SSR dashboard with React Query",
      "Vitals entry: BP, glucose, weight, SpO2, temperature",
      "FHIR Observation + MedicationRequest creation",
    ],
    color: "from-green-500 to-emerald-500",
  },
  {
    number: "04",
    icon: Pill,
    title: "E-Prescription & Reminders",
    description:
      "Doctor prescribes with exact reminder times. System schedules automated push/SMS/IVR delivery. Patient marks dose taken/skipped.",
    details: [
      "Celery beat scheduler for precise timing",
      "Web Push (PWA) → SMS → IVR cascade fallback",
      "Adherence logged to patient record & doctor view",
    ],
    color: "from-emerald-500 to-teal-500",
  },
  {
    number: "05",
    icon: CalendarCheck,
    title: "Next-Visit Prediction",
    description:
      "Rules-based (v1) / ML (v1.5+) follow-up window suggested. Doctor accepts/overrides. Patient gets reminder as date approaches.",
    details: [
      "Diagnosis-based intervals (e.g., HTN: 7-30 days)",
      "Doctor historical pattern calibration",
      "Patient sees 'Next check-up around [date]' in app",
    ],
    color: "from-teal-500 to-blue-500",
  },
  {
    number: "06",
    icon: Smartphone,
    title: "Patient PWA",
    description:
      "Installable on low-end Android. Offline cache of recent history. Icon-first navigation. Caregiver mode with patient consent.",
    details: [
      "Service Worker + Workbox for offline",
      "Voice-first, regional language TTS",
      "Family access with patient consent (ABDM-style)",
    ],
    color: "from-blue-500 to-indigo-500",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works in <span className="text-primary">6 Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From check-in to follow-up — every step automated, every record connected.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.article
              key={step.number}
              className={cn(
                "flex flex-col lg:flex-row gap-8 p-6 md:p-8 rounded-2xl bg-card border border-border",
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              )}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Visual column */}
              <div className="lg:w-1/3 flex-shrink-0 flex flex-col items-center lg:items-start">
                {/* Number badge */}
                <div
                  className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold text-xl md:text-2xl text-white mb-6",
                    "bg-gradient-to-br",
                    step.color
                  )}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center mb-6",
                    "bg-gradient-to-br",
                    step.color
                  )}
                >
                  <step.icon className="w-10 h-10 text-white" />
                </div>

                {/* Details list */}
                <ul className="w-full space-y-3 text-sm text-muted-foreground">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/50 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Content column */}
              <div className="lg:w-2/3 space-y-4">
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Mini flow indicators between steps */}
                {index < steps.length - 1 && (
                  <div className="absolute hidden lg:block left-1/2 top-full -translate-x-1/2 translate-y-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}