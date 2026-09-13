"use client";

import React, { useState, useEffect, useRef } from 'react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Volume2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function VoiceIntakeFlow() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("Hello. Please tell me in your own words, what brings you to the hospital today?");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  const { isRecording, transcript, startRecording, stopRecording, resetTranscript, error } = useAudioRecorder("en-IN");

  // Initialize SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // Stop anything currently playing
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      // Try to find a female Indian English voice if available, otherwise default
      const voices = synthRef.current.getVoices();
      const indianVoice = voices.find(v => v.lang === 'en-IN' && v.name.includes('Female')) || voices.find(v => v.lang === 'en-IN');
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      synthRef.current.speak(utterance);
    }
  };

  // Play initial greeting
  useEffect(() => {
    if (messages.length === 0 && currentQuestion) {
      // Small delay to allow voices to load
      setTimeout(() => {
        speak(currentQuestion);
      }, 500);
    }
  }, [messages.length, currentQuestion]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      handleSubmission(transcript);
    } else {
      if (synthRef.current) {
        synthRef.current.cancel(); // Stop speaking when starting to record
      }
      startRecording();
    }
  };

  const handleSubmission = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    resetTranscript();
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text }
    ];
    setMessages(newMessages);

    try {
      // Call our mock backend endpoint
      const response = await fetch('/api/intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await response.json();
      
      if (data.isComplete) {
        setIsComplete(true);
        setSummary(data.summary);
        
        // Trigger real-time update to Doctor Dashboard
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'intake_completed',
            summary: data.summary,
            patientId: 'current-patient' // In real app, from context
          })
        }).catch(err => console.error("Failed to emit event", err));

        setMessages([...newMessages, { role: 'assistant', content: "Thank you. Your symptom summary has been generated and sent to the doctor." }]);
        speak("Thank you. Your symptom summary has been generated and sent to the doctor.");
      } else {
        setCurrentQuestion(data.nextQuestion);
        setMessages([...newMessages, { role: 'assistant', content: data.nextQuestion }]);
        speak(data.nextQuestion);
      }
    } catch (err) {
      console.error("Failed to fetch next question", err);
      // Fallback behavior if API is down
      const fallbackMsg = "I'm having trouble connecting right now. Can you try again?";
      speak(fallbackMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete && summary) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card border rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Intake Complete</h2>
        <p className="text-muted-foreground mb-6">
          Your symptoms have been successfully recorded and shared with the doctor.
        </p>
        
        <div className="bg-muted p-4 rounded-xl text-left mb-6 text-sm space-y-2">
          <p><strong>Chief Complaint:</strong> {summary.chiefComplaint}</p>
          <p><strong>Duration:</strong> {summary.duration}</p>
          <p><strong>Severity:</strong> {summary.severity}/10</p>
          <p><strong>Associated Symptoms:</strong> {summary.associatedSymptoms?.join(", ")}</p>
        </div>

        <Button 
          onClick={() => router.push('/patient/appointments')}
          className="w-full flex items-center justify-center gap-2"
        >
          Go to Waiting Room <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col items-center">
      <div className="w-full bg-card border rounded-2xl shadow-sm p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min((messages.length / 10) * 100, 100)}%` }}></div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Triage Assistant</h3>
          <Button variant="ghost" size="icon" onClick={() => speak(currentQuestion)} className="text-primary hover:bg-primary/10">
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="text-xl font-medium text-foreground min-h-[80px]">
          {isProcessing ? (
            <span className="flex items-center gap-2 text-muted-foreground animate-pulse">
              Thinking...
            </span>
          ) : (
             currentQuestion
          )}
        </p>
      </div>

      <div className="w-full bg-muted/30 border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[250px]">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 w-full text-center">
            {error}
          </div>
        )}
        
        <VoiceVisualizer 
          isRecording={isRecording} 
          onClick={toggleRecording} 
          disabled={isProcessing}
        />
        
        {transcript && (
          <div className="mt-4 p-3 bg-card border rounded-lg text-sm w-full italic text-muted-foreground text-center animate-in fade-in slide-in-from-bottom-2">
            "{transcript}"
          </div>
        )}
      </div>
      
      {messages.length > 0 && (
        <div className="w-full mt-6">
          <p className="text-xs text-center text-muted-foreground">
            Question {Math.floor(messages.length / 2) + 1} of 10
          </p>
        </div>
      )}
    </div>
  );
}
