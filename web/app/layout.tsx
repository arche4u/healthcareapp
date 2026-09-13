import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OneHealth | Unified Patient-Centric Care Platform",
  description:
    "OneHealth unifies your medical history across every hospital you visit. Fingerprint check-in, AI symptom intake, automated medication reminders, and cross-hospital record sharing — all in one platform.",
  keywords: [
    "healthcare",
    "patient record",
    "electronic health record",
    "fingerprint check-in",
    "ABHA",
    "ABDM",
    "medication reminders",
    "telemedicine",
    "hospital management",
    "FHIR",
  ],
  authors: [{ name: "OneHealth" }],
  creator: "OneHealth",
  publisher: "OneHealth",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://onehealth.example.com",
    title: "OneHealth | Unified Patient-Centric Care Platform",
    description:
      "Your health, unified. Fingerprint check-in, AI symptom intake, and automated reminders across all your hospitals.",
    siteName: "OneHealth",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OneHealth Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneHealth | Unified Patient-Centric Care Platform",
    description:
      "Your health, unified. Fingerprint check-in, AI symptom intake, and automated reminders.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0088ff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}