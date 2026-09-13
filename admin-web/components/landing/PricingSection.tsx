"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "Perfect for a single clinic or small hospital getting started.",
    price: "₹14,999",
    period: "/month",
    features: [
      "Up to 5 doctors",
      "Face scan check-in",
      "Basic patient history",
      "AI symptom intake (10 Q)",
      "Medication reminders (Push + SMS)",
      "Next-visit prediction (rules)",
      "Email support",
    ],
    cta: "Start Free Trial",
    variant: "outline",
    popular: false,
  },
  {
    name: "Professional",
    description: "For multi-specialty hospitals needing full interoperability.",
    price: "₹69,999",
    period: "/month",
    features: [
      "Up to 50 doctors",
      "Cross-hospital record sharing",
      "ABHA integration & ABDM compliance",
      "Consent management dashboard",
      "Advanced vitals trend analytics",
      "IVR reminder fallback",
      "Priority email + phone support",
      "Dedicated onboarding engineer",
    ],
    cta: "Get Started",
    variant: "default",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For hospital networks, state deployments, and custom integrations.",
    price: "Custom",
    period: "",
    features: [
      "Unlimited doctors & hospitals",
      "Custom FHIR adapter development",
      "On-prem / air-gapped deployment",
      "SSO / LDAP integration",
      "Custom ML prediction models",
      "SLA guarantee (99.99%)",
      "24/7 dedicated support",
      "Data residency guarantees",
    ],
    cta: "Contact Sales",
    variant: "secondary",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
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
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees. All plans include unlimited patients, FHIR export, and ABDM compliance.
            Annual billing saves 20%.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              className={cn(
                "relative p-6 md:p-8 rounded-2xl bg-card border border-border",
                "flex flex-col h-full",
                plan.popular && "border-primary/50 shadow-xl shadow-primary/5",
                "transition-all duration-300"
              )}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-foreground/80"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                    >
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <Button
                asChild
                variant={plan.variant as any}
                className="w-full"
                size="lg"
              >
                <a href="#contact">{plan.cta}</a>
              </Button>
            </motion.article>
          ))}
        </div>

        {/* Note */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          All prices in INR. Government hospitals and non-profits eligible for{" "}
          <span className="font-medium text-primary">special pricing</span>.{" "}
          <a href="#contact" className="underline hover:text-primary">
            Contact us for details.
          </a>
        </motion.p>
      </div>
    </section>
  );
}