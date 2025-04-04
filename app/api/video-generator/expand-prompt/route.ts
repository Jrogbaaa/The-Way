import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OpenAIStream } from 'ai';
import OpenAI from 'openai';

// Input validation schema
const expandPromptSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.string().optional(),
  duration: z.number().default(30)
});

// Response type definition
export interface KeyframePrompt {
  scene: number;
  prompt: string;
  cameraAngle?: string;
  lighting?: string;
  action?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = expandPromptSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { prompt, style, duration } = validation.data;
    
    // Construct system prompt for generating keyframe prompts
    const systemPrompt = `You are a professional video storyboard creator and cinematographer.
Transform the user's video concept into a sequence of detailed keyframe prompts for a ${duration}-second video.
Create 6-10 keyframe descriptions that tell a coherent story, maintain character consistency,
and follow cinematic principles.

For each keyframe prompt include:
1. A detailed visual description (what we see)
2. Camera angle/movement
3. Lighting description
4. Character actions/expressions

${style ? `The video style should be: ${style}` : ''}

Format your response as a JSON array of keyframe objects with these properties:
- scene: number (starting from 1)
- prompt: string (detailed visual description)
- cameraAngle: string
- lighting: string
- action: string`;

    // Call OpenAI to generate the expanded prompts
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response to extract keyframe prompts
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI model');
    }

    const jsonResponse = JSON.parse(content);
    const keyframePrompts = jsonResponse.keyframePrompts || [];
    
    // Return the expanded keyframe prompts
    return NextResponse.json({ keyframePrompts });
  } catch (error) {
    console.error('Error expanding prompt:', error);
    return NextResponse.json(
      { error: 'Failed to expand prompt', code: 'ERR_PROMPT' },
      { status: 500 }
    );
  }
} 