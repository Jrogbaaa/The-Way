import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Extract key elements from the prompt
    const words = prompt.toLowerCase().split(/\s+/);
    const subjects = words.filter((w: string) => 
      !['a', 'the', 'and', 'or', 'in', 'on', 'at', 'by', 'with', 'to', 'from'].includes(w)
    ).slice(0, 3);
    
    const subject = subjects.length > 0 ? subjects[0] : "person";
    const location = words.includes("in") ? 
      words[words.indexOf("in") + 1] || "street" : "street";
    
    // Create varied scene prompts
    const scenePrompts = [
      `${subject} starting their journey in the ${location}, closeup shot, detailed background`,
      `${subject} in motion in the ${location}, mid-distance shot, golden hour lighting`,
      `${subject} interacting with surroundings in the ${location}, wide angle view`,
      `${subject} reaching a milestone in the ${location}, dramatic lighting, cinematic`,
      `${subject} overcoming a challenge in the ${location}, depth of field, emotional`,
      `${subject} concluding their journey in the ${location}, aerial perspective, vibrant colors`
    ];
    
    return NextResponse.json({ 
      scenePrompts,
      originalPrompt: prompt
    });
    
  } catch (error) {
    console.error('Error generating prompts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 