"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Camera,
  Brain,
  Bell,
  Calendar,
  Globe,
  Shield,
  HeartPulse,
  Smartphone,
  Users,
  Cloud,
  Zap,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Face Scan Check-In",
    description:
      "Instant patient identification at any hospital with a single face scan. No cards, no passwords, no waiting.",
    badge: "P0",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI Symptom Intake",
    description:
      "10-question voice-first triage in regional languages. Structured summary auto-routed to the right doctor before the consult.",
    badge: "P0",
    color: "from-cyan-500 to-green-500",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description:
      "Medication reminders at exact doctor-set times via push, SMS, or IVR fallback for feature phones. Adherence tracked automatically.",
    badge: "P0",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Calendar,
    title: "Next-Visit Prediction",
    description:
      "AI-suggested follow-up windows based on diagnosis and doctor patterns. Reduces missed follow-ups with timely patient notifications.",
    badge: "P1",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Globe,
    title: "Cross-Hospital Records",
    description:
      "FHIR R4 normalized records shared across hospitals with patient consent. ABDM/ABHA compliant from day one.",
    badge: "P0",
    color: "from-teal-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Privacy & Consent",
    description:
      "Patient-controlled consent for every data access. Audit trail for compliance. Biometrics stored as irreversible templates only.",
    badge: "P0",
    color: "from-blue-500 to-indigo-500",
  },
];

const benefits = [
  {
    icon: HeartPulse,
    title: "For Patients",
    items: [
      "Unified health record across all hospitals",
      "Voice-first intake in your language",
      "Medication reminders that work",
      "Next-visit predictions you trust",
    ],
  },
  {
    icon: Smartphone,
    title: "For Doctors",
    items: [
      "Pre-triaged patients with history ready",
      "Vitals entry in seconds, not minutes",
      "Prescriptions auto-trigger reminders",
      "Focus on clinical judgment, not data entry",
    ],
  },
  {
    icon: Users,
    title: "For Hospitals",
    items: [
      "Integrate without replacing your HIS",
      "ABDM compliance out of the box",
      "Capture DHIS financial incentives",
      "Interoperability without custom work",
    ],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
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
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Unified Care
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for India's healthcare ecosystem. FHIR-native. ABDM-ready. Offline-tolerant.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              className={cn(
                "group p-6 rounded-xl bg-card border border-border",
                "hover:border-primary/50 hover:shadow-lg transition-all duration-300",
                "relative overflow-hidden"
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Gradient accent bar */}
              <div
                className={cn(
                  "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
                  feature.color
                )}
              />

              <div className="relative z-10 space-y-4">
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br",
                    feature.color
                  )}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                  >
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Benefits by persona */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="p-6 rounded-xl bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
              <ul className="space-y-3">
                {benefit.items.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-2 text-muted-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.8 + i * 0.05 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}