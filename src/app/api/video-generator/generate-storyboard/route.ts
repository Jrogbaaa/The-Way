import { NextResponse } from 'next/server';
import { z } from 'zod';
import { KeyframePrompt, GeneratedFrame } from '@/types/video-generator';
import { v4 as uuidv4 } from 'uuid';

// Input validation schema
const generateStoryboardSchema = z.object({
  keyframePrompts: z.array(z.object({
    scene: z.number(),
    prompt: z.string(),
    cameraAngle: z.string().optional(),
    lighting: z.string().optional(),
    action: z.string().optional()
  })).min(1),
  characterReference: z.object({
    imageUrl: z.string().url().optional(),
    description: z.string().optional()
  }).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = generateStoryboardSchema.parse(body);
    
    // For now, return mock data
    const frames = validatedData.keyframePrompts.map(prompt => {
      return {
        id: uuidv4(),
        scene: prompt.scene,
        prompt: prompt.prompt,
        imageUrl: `https://picsum.photos/seed/${prompt.scene}/800/450`,
        metadata: {
          cameraAngle: prompt.cameraAngle || "Medium shot",
          lighting: prompt.lighting || "Standard",
          action: prompt.action || "Static",
          generatedAt: new Date().toISOString()
        }
      };
    });
    
    return NextResponse.json({ frames });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyboard' },
      { status: 500 }
    );
  }
} 