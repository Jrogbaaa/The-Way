import { NextResponse } from 'next/server';
import { z } from 'zod';
import { KeyframePrompt } from '../expand-prompt/route';
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

// Response type definition
export interface GeneratedFrame {
  id: string;
  imageUrl: string;
  prompt: string;
  scene: number;
  metadata: Record<string, any>;
}

// Mock function for image generation
// In production, this would connect to Stable Diffusion or similar API
async function generateImageFromPrompt(
  prompt: string, 
  characterReference?: { imageUrl?: string; description?: string }
): Promise<string> {
  // This is a mock - in production, would call actual generation API
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In production, this would return the actual image URL from generation service
  // For now, return a placeholder
  return `https://placeholder.co/800x450?text=${encodeURIComponent(prompt.substring(0, 20))}`;
}

// Function to enhance prompt with character consistency
function enhancePromptWithCharacterConsistency(
  prompt: string,
  characterReference?: { imageUrl?: string; description?: string }
): string {
  if (!characterReference?.description) {
    return prompt;
  }
  
  // Add character description to the prompt for consistency
  return `${prompt} The character is ${characterReference.description}.`;
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = generateStoryboardSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { keyframePrompts, characterReference } = validation.data;
    
    // Generate frames in parallel
    const framePromises = keyframePrompts.map(async (keyframePrompt) => {
      // Enhance prompt with character consistency guidance
      const enhancedPrompt = enhancePromptWithCharacterConsistency(
        keyframePrompt.prompt,
        characterReference
      );
      
      // Generate image from enhanced prompt
      const imageUrl = await generateImageFromPrompt(enhancedPrompt, characterReference);
      
      // Create frame object
      return {
        id: uuidv4(),
        imageUrl,
        prompt: enhancedPrompt,
        scene: keyframePrompt.scene,
        metadata: {
          cameraAngle: keyframePrompt.cameraAngle,
          lighting: keyframePrompt.lighting,
          action: keyframePrompt.action,
          generatedAt: new Date().toISOString(),
        }
      } as GeneratedFrame;
    });
    
    // Wait for all frames to be generated
    const frames = await Promise.all(framePromises);
    
    // Sort frames by scene number
    frames.sort((a, b) => a.scene - b.scene);
    
    // Return the generated frames
    return NextResponse.json({ frames });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyboard', code: 'ERR_KEYFRAME' },
      { status: 500 }
    );
  }
} 