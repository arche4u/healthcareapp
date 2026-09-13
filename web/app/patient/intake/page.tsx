import React from 'react';
import { VoiceIntakeFlow } from '@/components/voice/VoiceIntakeFlow';

export default function VoiceIntakePage() {
  return (
    <div className="flex-1 overflow-auto bg-muted/10 h-full w-full">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Voice Triage</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Answer a few quick questions so we can prepare the doctor for your visit.
          </p>
        </div>

        <div className="bg-background rounded-3xl shadow-sm border p-4 sm:p-8">
          <VoiceIntakeFlow />
        </div>
      </div>
    </div>
  );
}
