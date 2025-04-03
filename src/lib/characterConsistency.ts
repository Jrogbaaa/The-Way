import { Character, ModelParameters } from "@/types/storyboard";

/**
 * Extracts key features from a personalized AI model
 * to ensure consistency across generations
 */
export async function extractCharacterFeatures(modelId: string): Promise<ModelParameters> {
  try {
    // In a real implementation, this would call an API to analyze the model
    // and extract consistent features
    const response = await fetch(`/api/models/${modelId}/features`);
    
    if (!response.ok) {
      throw new Error(`Failed to extract features: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error extracting character features:", error);
    
    // Return default parameters if extraction fails
    return {
      facialFeatures: {},
      bodyType: "average",
      hairStyle: "default",
      hairColor: "brown",
      skinTone: "medium",
      clothing: [],
      accessories: [],
      distinguishingFeatures: []
    };
  }
}

/**
 * Enhance a generation prompt with character-specific details
 * to maintain consistency across multiple generations
 */
export function enhancePromptForConsistency(
  basePrompt: string, 
  characters: Character[],
  sceneContext: string
): string {
  // Build a detailed prompt that emphasizes character consistency
  let enhancedPrompt = basePrompt;
  
  // Add character details
  if (characters.length > 0) {
    const characterDescriptions = characters.map(character => {
      // Build a description emphasizing consistent features
      let description = `character ${character.name}`;
      
      // Add emotion if specified
      if (character.emotion && character.emotion !== "neutral") {
        description += ` with ${character.emotion} expression`;
      }
      
      // Add position if specified
      if (character.position) {
        description += ` positioned in the ${character.position}`;
      }
      
      // Add specific features if available
      if (character.features && character.features.length > 0) {
        description += ` with ${character.features.join(", ")}`;
      }
      
      return description;
    });
    
    enhancedPrompt += `, ${characterDescriptions.join(", ")}`;
  }
  
  // Add scene context
  enhancedPrompt += `, ${sceneContext}`;
  
  // Add quality parameters
  enhancedPrompt += ", high detail, cinematic lighting, professional photography";
  
  return enhancedPrompt;
}

/**
 * Analyze the consistency of character appearances across multiple images
 */
export async function analyzeCharacterConsistency(
  imageUrls: string[], 
  characterId: string
): Promise<{
  consistencyScore: number;
  inconsistentFeatures: string[];
}> {
  try {
    const response = await fetch("/api/consistency/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrls,
        characterId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Consistency analysis failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing character consistency:", error);
    return {
      consistencyScore: 0,
      inconsistentFeatures: ["Failed to analyze consistency"]
    };
  }
}

/**
 * Enforce consistency by adjusting a target image to match baseline features
 */
export async function enforceConsistency(
  baseImage: string,
  targetImage: string, 
  characterFeatures: string[]
): Promise<string> {
  try {
    const response = await fetch("/api/consistency/enforce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseImage,
        targetImage,
        characterFeatures
      })
    });
    
    if (!response.ok) {
      throw new Error(`Consistency enforcement failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.adjustedImageUrl;
  } catch (error) {
    console.error("Error enforcing character consistency:", error);
    return targetImage; // Return original if enforcement fails
  }
} 