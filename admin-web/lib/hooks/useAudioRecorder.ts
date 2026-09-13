import { useState, useEffect, useCallback, useRef } from "react";

// Add types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useAudioRecorder(language = "en-US") {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setError("Speech recognition is not supported in this browser.");
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startRecording = useCallback(() => {
    if (recognitionRef.current) {
      setError(null);
      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    error
  };
}
