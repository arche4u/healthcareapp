"use client";

import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FaceScannerProps {
  onScanComplete: (imageBase64: string) => void;
  isLoading?: boolean;
}

export function FaceScanner({ onScanComplete, isLoading = false }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setHasCamera(true);
      setError(null);
    } catch (err: any) {
      console.error("Camera access denied", err);
      setError("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setHasCamera(false);
    }
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(base64Image);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const submit = useCallback(() => {
    if (capturedImage) {
      onScanComplete(capturedImage);
    }
  }, [capturedImage, onScanComplete]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  React.useEffect(() => {
    if (hasCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [hasCamera, stream]);

  return (
    <div className="flex flex-col items-center p-4 bg-card border rounded-xl shadow-sm max-w-md mx-auto">
      {error && (
        <div className="w-full mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-6">
        {!hasCamera && !capturedImage && !error && (
          <div className="text-center p-6">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              We need access to your camera to perform a real-time biometric face scan.
            </p>
            <Button onClick={startCamera}>Start Camera</Button>
          </div>
        )}

        {hasCamera && !capturedImage && (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute inset-0 border-4 border-dashed border-primary/50 m-8 rounded-full pointer-events-none opacity-70"></div>
          </>
        )}

        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured face" 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {hasCamera && !capturedImage && (
        <Button 
          size="lg" 
          onClick={captureFrame} 
          className="w-full rounded-full py-6 text-lg font-semibold shadow-lg"
        >
          Scan Face
        </Button>
      )}

      {capturedImage && (
        <div className="flex w-full gap-4">
          <Button variant="outline" onClick={retake} className="flex-1 flex items-center gap-2" disabled={isLoading}>
            <RefreshCw className="w-4 h-4" /> Retake
          </Button>
          <Button onClick={submit} className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
            {isLoading ? "Processing..." : <><Check className="w-4 h-4" /> Use this Scan</>}
          </Button>
        </div>
      )}
    </div>
  );
}
