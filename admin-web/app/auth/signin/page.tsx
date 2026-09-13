"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/landing/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"patient" | "hospital_admin">("hospital_admin");
  // Patient extra fields
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("unknown");
  // Hospital admin extra fields
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalCity, setHospitalCity] = useState("");
  const [hospitalState, setHospitalState] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let registrationData: any = null;

      // ── Sign In ──────────────────────────────────────────────────────────────
      if (mode === "signin") {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Authentication failed");

        localStorage.setItem("accessToken", data.access_token);
        if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);

        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        const userRole = payload.role;

        let target = callbackUrl !== "/dashboard" ? callbackUrl : "/dashboard";
        if (callbackUrl === "/dashboard") {
          if (userRole === "patient") target = "/patient";
          else if (userRole === "nurse") target = "/nurse";
          else if (userRole === "hospital_admin") target = "/hospital-admin";
          else target = "/dashboard";
        }
        router.push(target);
        return;
      }

      // ── Hospital Admin Sign Up ───────────────────────────────────────────────
      if (role === "hospital_admin") {
        if (!hospitalName.trim()) {
          setError("Hospital name is required.");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/auth/register-hospital`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email, password, full_name: fullName,
            hospital_name: hospitalName,
            hospital_city: hospitalCity,
            hospital_state: hospitalState,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        registrationData = data;
      } else {
        // ── Patient / Doctor / Nurse Sign Up ──────────────────────────────────
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName, role, phone, dob, gender }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        registrationData = data;
      }

      // Auto-login after signup
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const tokenData = await loginRes.json();
      if (!loginRes.ok) throw new Error(tokenData.error || "Auto-login failed");

      localStorage.setItem("accessToken", tokenData.access_token);
      if (tokenData.refresh_token) localStorage.setItem("refreshToken", tokenData.refresh_token);

      const payload = JSON.parse(atob(tokenData.access_token.split(".")[1]));
      const userRole = payload.role;

      if (userRole === "patient") router.push("/patient");
      else if (userRole === "nurse") router.push("/nurse");
      else if (userRole === "hospital_admin") router.push("/hospital-admin");
      else router.push("/dashboard");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                OneHealth
              </span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your unified health record"
                : "Register as a hospital admin"}
            </p>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5 bg-card border border-border rounded-2xl p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {mode === "signin" ? (
                <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email Address</label>
                      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="you@example.com" required autoComplete="email" />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                      <div className="relative">
                        <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-12"
                          placeholder="••••••••" required autoComplete="current-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4">

                    {/* Hospital admin: hospital name + location */}
                    <AnimatePresence>
                      {role === "hospital_admin" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-primary">
                              Registering as Hospital Admin creates a new hospital and gives you full control over staff registration.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Hospital Name <span className="text-red-500">*</span></label>
                            <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                              placeholder="e.g. City Medical Center" required={role === "hospital_admin"} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium mb-1.5">City</label>
                              <input type="text" value={hospitalCity} onChange={(e) => setHospitalCity(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                                placeholder="City" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">State</label>
                              <input type="text" value={hospitalState} onChange={(e) => setHospitalState(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                                placeholder="State" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>


                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">Full Name</label>
                      <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="Your full name" required autoComplete="name" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email Address</label>
                      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="you@example.com" required autoComplete="email" />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                      <div className="relative">
                        <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-12"
                          placeholder="••••••••" required autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                mode === "signin" ? "Sign In" : "Register Hospital"
              )}
            </Button>
          </motion.form>

          <motion.p
            className="text-center text-sm text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </motion.p>
        </motion.div>
      </main>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SignInForm />
    </Suspense>
  );
}