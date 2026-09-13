import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OneHealth - Unified Patient-Centric Care",
    short_name: "OneHealth",
    description:
      "OneHealth unifies your medical history across every hospital you visit. Fingerprint check-in, AI symptom intake, automated medication reminders.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0088ff",
    orientation: "any",
  };
}