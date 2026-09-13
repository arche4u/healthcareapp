"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Camera, ShieldCheck, X, RefreshCw, Check } from "lucide-react";
import { identityAPI, authAPI, decodeJWT, getAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export function FaceRegistrationModal() {
  const [show, setShow] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [step, setStep] = useState<"intro" | "camera" | "success">("intro");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    // Check if patient needs face registration
    const token = getAccessToken();
    if (!token) return;
    const payload = decodeJWT(token);
    if (payload?.role !== "patient") return;

    const pid = payload?.patient_id || payload?.sub;
    if (!pid) return;

    // Check if face registration was already done (stored in localStorage)
    const faceRegistered = localStorage.getItem(`face_registered_${pid}`);
    if (faceRegistered) return;

    // Check via API
    authAPI.userinfo().then((user: any) => {
      // Check patient face status
      identityAPI.getPatient(pid).then((patient: any) => {
        if (!patient?.biometricTemplateHash && !patient?.faceRegistered) {
          setPatientId(pid);
          setShow(true);
        }
      }).catch(() => {
        // If we can't check, show the modal anyway to be safe
        setPatientId(pid);
        setShow(true);
      });
    }).catch(() => {});
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      setHasCamera(true);
      setError("");
    } catch (err: any) {
      setError("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    if (step === "camera" && hasCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Play failed", e));
    }
  }, [step, hasCamera, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setHasCamera(false);
    }
  }, [stream]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCapturedImage(null);
    setError("");
    startCamera();
  };

  const handleRegister = async () => {
    if (!capturedImage || !patientId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await identityAPI.registerFace(patientId, capturedImage);
      if (res.status === "success") {
        localStorage.setItem(`face_registered_${patientId}`, "1");
        setStep("success");
        setTimeout(() => setShow(false), 2000);
      } else {
        setError(res.error || "Face registration failed. Please try again.");
        // Do not auto-retake, let the user read the error
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      // Do not auto-retake, let the user read the error
    } finally {
      setSubmitting(false);
    }
  };

  const openCamera = async () => {
    setStep("camera");
    setCapturedImage(null);
    await startCamera();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Face Registration Required</h2>
              <p className="text-xs text-muted-foreground">One-time setup for biometric check-in</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === "intro" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                To use OneHealth's fast biometric check-in at hospitals, you need to register your face once. 
                This lets nurses quickly identify you without paperwork.
              </p>
              <div className="space-y-2.5">
                {[
                  "Fast check-in at any OneHealth hospital",
                  "Secure — your face data is encrypted",
                  "No ID card needed at reception",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ This step is required. You cannot skip face registration.
                </div>
              </div>
              <Button className="w-full gap-2 mt-2" onClick={openCamera}>
                <Camera className="h-4 w-4" />
                Start Face Registration
              </Button>
            </div>
          )}

          {step === "camera" && (
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="relative rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
                {!capturedImage ? (
                  <>
                    {hasCamera ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground p-6">
                        <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Initializing camera…</p>
                      </div>
                    )}
                    {/* Face guide overlay */}
                    {hasCamera && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-52 border-2 border-primary/60 rounded-full opacity-60" />
                      </div>
                    )}
                  </>
                ) : (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {!capturedImage ? (
                <Button className="w-full gap-2" onClick={captureFrame} disabled={!hasCamera}>
                  <Camera className="h-4 w-4" />
                  Capture Photo
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={retake}>
                    <RefreshCw className="h-4 w-4" />
                    Retake
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleRegister} disabled={submitting}>
                    {submitting ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Registering…</>
                    ) : (
                      <><Check className="h-4 w-4" /> Register Face</>
                    )}
                  </Button>
                </div>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Position your face within the oval and ensure good lighting.
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-3">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Face Registered!</h3>
              <p className="text-sm text-muted-foreground">
                You can now check in at any OneHealth hospital using your face.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
