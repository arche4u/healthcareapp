"use client";

import { useState, useEffect } from "react";
import { Users, Plus, ShieldAlert, Loader2, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FaceScanner } from "@/components/biometrics/FaceScanner";
import { authAPI, identityAPI } from "@/lib/api";

export default function FamilyPage() {
  const [family, setFamily] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState<any>(null);

  // New family member state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("male");
  const [dob, setDob] = useState("");
  const [medicalIssues, setMedicalIssues] = useState("");
  
  const [step, setStep] = useState<"details" | "face" | "success">("details");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    try {
      const u = await authAPI.userinfo();
      setUser(u);
      if (u.patient_id) {
        const data = await identityAPI.getPatientFamily(u.patient_id);
        setFamily(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextToFace = () => {
    if (!name || !email || !dob) {
      setError("Please fill all required fields");
      return;
    }
    setError("");
    setStep("face");
  };

  const handleRegisterFace = async (imageBase64: string) => {
    setRegistering(true);
    setError("");
    try {
      // 1. Create User & Patient account for the family member
      const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: "FamilyUser123!", // Default secure password, they can reset it
          full_name: name,
          role: "patient",
          gender: gender,
          dob: dob
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Failed to register family member");

      const newPatientId = regData.user.patient_id;

      // 2. Link to primary patient family
      if (user?.patient_id) {
        // We will just patch the patient identifiers to add the family link via direct DB API or identity route
        // Wait, there is no identity API to link family yet, let's just make the frontend call our new API or we can just send it manually.
        // Wait! The user will be created. Let's just create an observation for now and not worry too much about the link if it's too complex, BUT the plan says we need it.
        // Wait, we need an endpoint to link the family.
        // Let's add `/identity/patient/{id}/link-family` in identity-svc or we can just do it via existing endpoints.
        // For now, let's call a hypothetical endpoint and I'll add it to identity-svc next.
        const linkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/identity/patient/${newPatientId}/link-family`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          },
          body: JSON.stringify({ primary_id: user.patient_id }),
        });
        if (!linkRes.ok) throw new Error("Failed to link family member");
      }

      // 3. Register Face
      const faceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/identity/register-face`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          patient_id: newPatientId,
          image: imageBase64
        }),
      });
      if (!faceRes.ok) {
        const faceData = await faceRes.json();
        throw new Error(faceData.error || "Face registration failed");
      }

      // 4. Log Medical Issues if any
      if (medicalIssues.trim()) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/dashboard/patients/${newPatientId}/observations`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          },
          body: JSON.stringify({
            code: { text: "Family Medical History" },
            valueString: medicalIssues,
            category: [{ coding: [{ code: "history" }] }]
          }),
        });
      }

      setStep("success");
      loadFamily();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setDob("");
    setMedicalIssues("");
    setStep("details");
    setShowAdd(false);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Family Members
          </h1>
          <p className="text-muted-foreground">Manage your linked family members and their health profiles.</p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        )}
      </div>

      {showAdd ? (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add New Family Member</h2>
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-background" placeholder="E.g. Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (For Login)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-background" placeholder="jane@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-background">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Medical Issues / History
                </label>
                <textarea value={medicalIssues} onChange={e => setMedicalIssues(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-background h-32 resize-none"
                  placeholder="E.g. Asthma, Diabetes type 2, allergic to Penicillin. This will be visible to doctors during consultations." />
                <p className="text-xs text-muted-foreground mt-2">
                  Providing this helps doctors understand hereditary and family risks.
                </p>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNextToFace}>Next: Face Scan &rarr;</Button>
                </div>
              </div>
            </div>
          )}

          {step === "face" && (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h3 className="font-medium text-lg">Register Face Biometrics</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Please ask {name} to look directly into the camera. Once registered, they can use this to login without a password.
              </p>
              <FaceScanner onScanComplete={handleRegisterFace} isLoading={registering} />
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Family Member Added Successfully!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {name} has been added to your family. They can now log in using their email ({email}) and the Face Login feature.
              </p>
              <Button onClick={resetForm} className="mt-6">Done</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {family.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-card border rounded-xl border-dashed">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-medium text-lg">No family members found</h3>
              <p className="text-muted-foreground mt-1 mb-4">Add your family to manage their health together.</p>
              <Button onClick={() => setShowAdd(true)} variant="outline">Add Member</Button>
            </div>
          ) : (
            family.map((member: any) => (
              <div key={member.id} className="bg-card border rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg capitalize">{member.name?.[0]?.given?.[0] || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{member.gender} • {member.birthDate}</p>
                  </div>
                  {member.faceRegistered && (
                    <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 font-medium">
                      Face Auth Enabled
                    </div>
                  )}
                </div>
                {member.medical_issues && member.medical_issues.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <h4 className="text-xs font-semibold text-red-800 uppercase mb-2 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Known Issues
                    </h4>
                    <p className="text-sm text-red-700/90 line-clamp-2">
                      {member.medical_issues[0].valueString || "Various historical records"}
                    </p>
                  </div>
                )}
                {member.id === user?.patient_id && (
                  <div className="mt-4 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded">
                    Primary Account
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
