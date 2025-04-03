import { ShotType, EmotionType } from "@/types/storyboard";

/**
 * Scene suggestion interface returned by the AI assistant
 */
interface SceneSuggestion {
  description: string;
  shotType: ShotType;
  characters: string[];
  suggestedEmotion: EmotionType;
  setting: string;
}

/**
 * Character description for the AI assistant
 */
interface CharacterDescription {
  name: string;
  description: string;
}

/**
 * Use AI to suggest a coherent storyboard sequence based on a premise and characters
 */
export async function suggestStoryboardSequence(
  storyPremise: string,
  characters: CharacterDescription[],
  duration: number
): Promise<SceneSuggestion[]> {
  // Calculate number of scenes to generate (approximately 1 every 2 seconds)
  const sceneCount = Math.max(2, Math.round(duration / 2));
  
  try {
    const response = await fetch("/api/ai/storyboard-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        premise: storyPremise,
        characters,
        sceneCount,
        duration
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate storyboard suggestions: ${response.status}`);
    }
    
    const data = await response.json();
    return data.scenes;
  } catch (error) {
    console.error("Error generating storyboard suggestions:", error);
    
    // Provide a fallback simple storyboard if the API fails
    return generateFallbackStoryboard(storyPremise, characters, sceneCount);
  }
}

/**
 * Generate a simple fallback storyboard if the AI service fails
 */
function generateFallbackStoryboard(
  premise: string,
  characters: CharacterDescription[],
  sceneCount: number
): SceneSuggestion[] {
  const shotTypes: ShotType[] = ["establishing", "wide", "medium", "close-up", "extreme-close-up"];
  const emotions: EmotionType[] = ["neutral", "joy", "sadness", "surprise", "thoughtful"];
  const settings = ["living room", "outside", "office", "park", "street"];
  
  // Always start with an establishing shot
  const scenes: SceneSuggestion[] = [
    {
      description: `Establishing shot introducing the setting with ${characters.map(c => c.name).join(" and ")}`,
      shotType: "establishing",
      characters: characters.map(c => c.name),
      suggestedEmotion: "neutral",
      setting: settings[0]
    }
  ];
  
  // Generate remaining scenes
  for (let i = 1; i < sceneCount; i++) {
    scenes.push({
      description: `Scene ${i + 1} of the story about ${premise}`,
      shotType: shotTypes[i % shotTypes.length],
      characters: characters.map(c => c.name).slice(0, (i % characters.length) + 1),
      suggestedEmotion: emotions[i % emotions.length],
      setting: settings[i % settings.length]
    });
  }
  
  return scenes;
}

/**
 * Generate more detailed description for a specific scene
 */
export async function enhanceSceneDescription(
  sceneDescription: string,
  characters: CharacterDescription[],
  shotType: ShotType,
  setting: string
): Promise<string> {
  try {
    const response = await fetch("/api/ai/enhance-scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneDescription,
        characters,
        shotType,
        setting
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to enhance scene description: ${response.status}`);
    }
    
    const data = await response.json();
    return data.enhancedDescription;
  } catch (error) {
    console.error("Error enhancing scene description:", error);
    return sceneDescription; // Return original if enhancement fails
  }
} 