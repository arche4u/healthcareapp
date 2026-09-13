import { NextResponse } from 'next/server';

const mockQuestions = [
  "How long have you been experiencing these symptoms?",
  "On a scale of 1 to 10, how severe is the discomfort?",
  "Are you experiencing any other symptoms, like fever, nausea, or dizziness?",
  "Have you taken any medication for this recently?"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;
    
    // Simple mock logic based on conversation length
    // Each pair is (system/assistant question) + (user answer)
    // messages array contains just the user messages since we didn't send assistant history, 
    // or wait, VoiceIntakeFlow appends both system and user?
    // In VoiceIntakeFlow, we only append newMessages which has the user's latest response.
    
    // Calculate how many user messages exist
    const userMessagesCount = messages.filter((m: any) => m.role === 'user').length;
    
    // Simulate network delay for LLM thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // If we've asked enough questions (e.g. 3), return a summary
    if (userMessagesCount >= 3) {
      return NextResponse.json({
        isComplete: true,
        summary: {
          chiefComplaint: messages[0]?.content || "Not specified",
          duration: messages[1]?.content || "Not specified",
          severity: messages[2]?.content || "Not specified",
          associatedSymptoms: ["Fever", "Nausea"] // Mocked
        }
      });
    }

    // Otherwise, return the next question
    const nextQuestionIndex = Math.min(userMessagesCount - 1, mockQuestions.length - 1);
    
    return NextResponse.json({
      isComplete: false,
      nextQuestion: mockQuestions[nextQuestionIndex >= 0 ? nextQuestionIndex : 0]
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
