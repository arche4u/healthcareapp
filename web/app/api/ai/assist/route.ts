import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { vitals, symptoms, history, patientInfo } = await req.json();

    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 500 });
    }

    const prompt = `You are an AI medical assistant for a doctor. Analyze the following patient data and suggest potential causes and possible diagnoses based on their symptoms. Keep it concise, structured, and professional. Use markdown formatting.

Patient Info:
Age: ${patientInfo?.age || 'Unknown'}
Gender: ${patientInfo?.gender || 'Unknown'}

Triage Vitals:
Blood Pressure: ${vitals?.bp || '--'}
Heart Rate: ${vitals?.hr || '--'} bpm
Temperature: ${vitals?.temp || '--'} F
Weight: ${vitals?.weight || '--'} kg

Chief Complaint / Symptoms:
${symptoms || 'None recorded'}

Past Medical History:
${history || 'None recorded'}

Provide a brief analysis and a list of possible causes/diagnoses. Disclaimer: Remind the doctor this is AI assistance.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("NVIDIA API Error:", errorData);
      return NextResponse.json({ error: "Failed to generate AI insights" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ result: data.choices[0].message.content });

  } catch (error) {
    console.error("AI Assist Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
