import { NextResponse } from 'next/server';
import { parseNarrative } from '@/lib/narrative-parser';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Use our new narrative parser to break down the prompt into scenes
    const scenes = parseNarrative(prompt);
    
    // Format the response with the scene data
    return NextResponse.json({ 
      scenes,
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