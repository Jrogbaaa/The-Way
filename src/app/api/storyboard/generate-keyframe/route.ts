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
  
  // Define the model ID (e.g., SDXL) - ensure this includes the version hash
  const replicateModelId = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'; // Example SDXL model

  const response = await fetch("/api/replicate", { // Target the generic replicate endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelId: replicateModelId, // Pass the specific model/version
      input: { // Structure input according to the model's needs
        prompt: prompt,
        // modelIds, // The generic endpoint doesn't handle multiple model IDs directly here
        // previousImageUrl, // Consistency via previous image needs specific model support or logic
        // consistencyLevel, // Not directly supported by the generic endpoint's input structure
        width: 1024, // Standard params for SDXL
        height: 1024,
        num_outputs: 1,
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Unknown error occurred parsing error response" // Updated error message
    }));
    
    // Log the detailed error from the API if available
    console.error("Error response from /api/replicate:", errorData);
    
    throw new Error(
      `Image generation via /api/replicate failed: ${errorData.error || response.statusText}` // Use error from response body
    );
  }
  
  // Handle response structure from /api/replicate
  const data = await response.json();
  
  // Handle cases where polling might be required (status 201) or immediate output (status 200)
  // For now, assume direct output is returned in data.output
  // TODO: Implement polling for predictions that return status 201
  if (response.status === 201) {
     console.warn("Received status 201 from /api/replicate, polling not implemented yet. Prediction ID:", data.id);
     // For now, throw an error or return a placeholder, as the image isn't ready
     throw new Error("Image generation started but requires polling (not implemented).");
  }

  if (response.status === 200 && data.output && Array.isArray(data.output) && data.output.length > 0) {
    // Assuming the output is an array of URLs, take the first one
    const imageUrl = data.output[0]; 
    if (typeof imageUrl !== 'string') {
       throw new Error("Image generation service returned invalid output format.");
    }
    return {
      imageUrl: imageUrl,
      // Metadata might not be directly available in the output array; depends on the Replicate model
      metadata: data.metadata || {} // Attempt to get metadata if present, otherwise empty object
    };
  } else {
     // Handle unexpected successful response structure
     console.error("Unexpected successful response structure from /api/replicate:", data);
     throw new Error("Image generation service returned an unexpected response structure.");
  }
} 