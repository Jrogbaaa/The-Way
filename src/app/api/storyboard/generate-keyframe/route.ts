import { NextRequest, NextResponse } from "next/server";
import { enhancePromptForConsistency } from "@/lib/characterConsistency";
import { Character, ImageGenerationResult, ShotType } from "@/types/storyboard";

interface RequestBody {
  sceneDescription: string;
  characters: Character[];
  shotType: ShotType;
  setting: string;
  previousKeyframeUrl?: string;
}

/**
 * API route for generating a keyframe image based on scene description
 * and character details, with consistency maintained between frames
 */
export async function POST(req: NextRequest) {
  try {
    const {
      sceneDescription,
      characters,
      shotType,
      setting,
      previousKeyframeUrl
    } = await req.json() as RequestBody;
    
    // Validate required input
    if (!sceneDescription || !characters || !shotType || !setting) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Check if all characters have valid model IDs
    if (characters.some(c => !c.modelId)) {
      return NextResponse.json(
        { success: false, error: "All characters must have valid model IDs" },
        { status: 400 }
      );
    }
    
    // Enhance the prompt with character details for consistency
    const enhancedPrompt = enhancePromptForConsistency(
      sceneDescription,
      characters,
      `${shotType} shot of ${setting}`
    );
    
    // Generate the image using the enhanced prompt
    const imageResult = await generateConsistentImage({
      prompt: enhancedPrompt,
      modelIds: characters.map(c => c.modelId),
      previousImageUrl: previousKeyframeUrl,
      consistencyLevel: "high"
    });
    
    return NextResponse.json({
      success: true,
      keyframeUrl: imageResult.imageUrl,
      metadata: imageResult.metadata
    });
  } catch (error) {
    console.error("Keyframe generation error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate keyframe" 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a consistent image using appropriate backend services
 * This would integrate with your actual image generation backend
 */
async function generateConsistentImage({
  prompt,
  modelIds,
  previousImageUrl,
  consistencyLevel
}: {
  prompt: string;
  modelIds: string[];
  previousImageUrl?: string;
  consistencyLevel: "low" | "medium" | "high";
}): Promise<ImageGenerationResult> {
  // Implementation would depend on which image generation backend you're using
  // This could be Stable Diffusion, Midjourney, DALL-E, etc.
  
  const response = await fetch("/api/images/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      modelIds,
      previousImageUrl,
      consistencyLevel,
      width: 1024,
      height: 1024,
      numberOfImages: 1
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Unknown error occurred"
    }));
    
    throw new Error(
      `Image generation failed: ${errorData.error || response.statusText}`
    );
  }
  
  const data = await response.json();
  
  // Basic validation of the response
  if (!data.images || !data.images[0]) {
    throw new Error("Image generation service returned no images");
  }
  
  return {
    imageUrl: data.images[0].url,
    metadata: data.metadata || {}
  };
} 