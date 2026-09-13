"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#integrations" },
    { label: "API Docs", href: "/docs/api" },
    { label: "Changelog", href: "/changelog" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Press", href: "/press" },
    { label: "Contact", href: "#contact" },
  ],
  Compliance: [
    { label: "ABDM/ABHA", href: "/compliance/abdm" },
    { label: "FHIR R4", href: "/compliance/fhir" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Security", href: "/security" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Developer Portal", href: "/developers" },
    { label: "Community", href: "/community" },
    { label: "Support", href: "/support" },
    { label: "Status", href: "/status" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                OneHealth
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Unified patient-centric care platform for India. FHIR-native, ABDM-ready, offline-tolerant.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:hello@onehealth.example.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <nav>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.Product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.Company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Compliance */}
          <nav>
            <h4 className="font-semibold mb-4">Compliance</h4>
            <ul className="space-y-3">
              {footerLinks.Compliance.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.Resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OneHealth. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Gurugram, Haryana, India
            </span>
            <span>·</span>
            <a href="mailto:hello@onehealth.example.com" className="hover:text-foreground transition-colors">
              hello@onehealth.example.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}