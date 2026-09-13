"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Building2, ScanFace, Key } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/landing/Navbar";
import { FaceScanner } from "@/components/biometrics/FaceScanner";

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
  const [role, setRole] = useState<"patient" | "hospital_admin">("patient");
  // Patient extra fields
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("unknown");
  // Hospital admin extra fields
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalCity, setHospitalCity] = useState("");
  const [hospitalState, setHospitalState] = useState("");

  const [loginMethod, setLoginMethod] = useState<"password" | "face">("password");

  const handleFaceLogin = async (imageBase64: string) => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, image: imageBase64 }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
                : "Register as a patient"}
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

                    <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
                      <button type="button" onClick={() => setLoginMethod("password")}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${loginMethod === "password" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        <Key className="w-4 h-4" /> Password
                      </button>
                      <button type="button" onClick={() => setLoginMethod("face")}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${loginMethod === "face" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        <ScanFace className="w-4 h-4" /> Face Scan
                      </button>
                    </div>

                    {loginMethod === "password" ? (
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
                    ) : (
                      <div className="pt-2">
                        <FaceScanner onScanComplete={handleFaceLogin} isLoading={loading} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4">


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

                    {/* Patient-specific fields */}
                    {role === "patient" && (
                      <>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></label>
                          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            placeholder="+91 9876543210" autoComplete="tel" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="dob" className="block text-sm font-medium mb-1.5">Date of Birth</label>
                            <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                              max={new Date().toISOString().split("T")[0]} />
                          </div>
                          <div>
                            <label htmlFor="gender" className="block text-sm font-medium mb-1.5">Gender</label>
                            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm">
                              <option value="unknown">Prefer not to say</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
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

            {loginMethod === "password" && (
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  mode === "signin" ? "Sign In" : "Create Account"
                )}
              </Button>
            )}
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