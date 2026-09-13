"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="pt-20 pb-20 md:pt-28 md:pb-32 relative min-h-screen flex items-center">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <span className="block">Your Health,</span>
              <span className="block bg-gradient-to-r from-primary via-secondary to-green-400 bg-clip-text text-transparent">
                Unified Across Every Hospital
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              OneHealth unifies your medical history across every hospital you visit.
              One face scan check-in. One lifelong health record. AI-powered symptom
              intake. Automated medication reminders. All in one beautiful platform.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Button asChild size="lg" className="font-semibold">
                <Link href="/auth/signup">
                  Get Started Free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex items-center space-x-6 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-xs text-muted-foreground">Hospitals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">1M+</div>
                <div className="text-xs text-muted-foreground">Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: 3D Scene */}
          <motion.div
            className="relative h-[500px] lg:h-[600px] w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
          >
            {/* Import the 3D scene lazily on the client only */}
            <LazyHealthScene />
          </motion.div>
        </div>
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
    </section>
  );
}

// Lazy load the 3D scene
const LazyHealthScene = () => {
  const [HealthSceneWrapper, setHealthSceneWrapper] = useState<any>(null);

  useEffect(() => {
    import("@/components/canvas/HealthScene").then((mod) => {
      setHealthSceneWrapper(() => mod.HealthSceneWrapper);
    });
  }, []);

  if (!HealthSceneWrapper) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading 3D scene...</div>
      </div>
    );
  }

  return <HealthSceneWrapper />;
};