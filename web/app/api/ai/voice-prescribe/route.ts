import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NVIDIA API key not configured' }, { status: 500 });
    }

    const prompt = `You are a medical assistant that extracts prescription details from spoken doctor instructions.

Extract the medication name and dosage instructions from the following spoken text and return ONLY valid JSON with no extra text, explanation, or markdown.

Spoken text: "${transcript}"

Return exactly this JSON format:
{"medication": "medication name with strength", "instructions": "dosage and frequency instructions"}

Examples:
- "Prescribe Amoxicillin 500mg twice daily for 5 days" → {"medication": "Amoxicillin 500mg", "instructions": "1 tablet twice daily for 5 days"}
- "Give Paracetamol 650 three times a day" → {"medication": "Paracetamol 650mg", "instructions": "1 tablet three times daily"}
- "Metformin 500mg once a day with food" → {"medication": "Metformin 500mg", "instructions": "1 tablet once daily with food"}`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', errorText);
      return NextResponse.json({ error: 'AI parsing failed' }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim();

    // Extract JSON from the response (strip markdown code fences if present)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', rawContent);
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.medication) {
      return NextResponse.json({ error: 'Could not extract medication from speech' }, { status: 422 });
    }

    return NextResponse.json({
      medication: parsed.medication || '',
      instructions: parsed.instructions || '',
    });

  } catch (error) {
    console.error('Voice prescribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
