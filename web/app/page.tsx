/**
 * OneHealth Landing Page
 * Beautiful 3D animated landing page with full feature showcase.
 */
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}