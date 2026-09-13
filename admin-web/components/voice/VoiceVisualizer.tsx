"use client";

import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceVisualizer({ isRecording, onClick, disabled = false }: VoiceVisualizerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 my-8">
      <div className="relative flex items-center justify-center w-32 h-32">
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse"></div>
          </>
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-105'}`}
        >
          {isRecording ? (
            <Mic className="w-8 h-8 animate-pulse" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
        </button>
      </div>
      
      <div className="text-center">
        <p className={`font-medium ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
          {isRecording ? 'Listening...' : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
}
