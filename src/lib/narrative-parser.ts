/**
 * Narrative processing utility functions for the Quick Video Test feature
 * Handles narrative scene parsing, image prompt generation, and video animation prompts
 */

export type Scene = {
  id: string;
  sequence: number;
  description: string;
  subjects: string[];
  actions: string[];
  locations: string[];
  objects: string[];
  emotions?: string[];
  imagePrompt: string;
  videoPrompt: string;
};

/**
 * Parses a narrative into logical scenes
 */
export const parseNarrative = (narrative: string): Scene[] => {
  // Clean up the narrative text
  const cleanNarrative = narrative.trim().replace(/\s+/g, ' ');
  
  // Simple scene splitting based on narrative markers
  const sceneSplitters = [
    '. then ', ' and then ', '. afterwards ', ' next, ', 
    '. suddenly, ', ' finally, ', '. meanwhile, '
  ];
  
  // Split into potential scenes
  let sceneTexts: string[] = [cleanNarrative];
  
  // Try to split by common narrative transitions
  for (const splitter of sceneSplitters) {
    if (cleanNarrative.toLowerCase().includes(splitter)) {
      sceneTexts = cleanNarrative
        .toLowerCase()
        .split(new RegExp(splitter, 'i'))
        .map(text => text.trim())
        .filter(text => text.length > 0);
      break;
    }
  }
  
  // If we couldn't split it with markers, try to create logical divisions
  // based on sentence structure and length
  if (sceneTexts.length === 1 && cleanNarrative.length > 60) {
    const sentences = cleanNarrative
      .split(/[.!?]/)
      .map(text => text.trim())
      .filter(text => text.length > 0);
    
    if (sentences.length > 1) {
      sceneTexts = sentences;
    } else {
      // Fallback: Create 3-6 scenes from the narrative by logical division
      // For longer narratives, create more scenes
      const sceneCount = Math.min(Math.max(3, Math.ceil(cleanNarrative.length / 40)), 6);
      const words = cleanNarrative.split(' ');
      const wordsPerScene = Math.ceil(words.length / sceneCount);
      
      sceneTexts = [];
      for (let i = 0; i < sceneCount; i++) {
        const startIdx = i * wordsPerScene;
        const endIdx = Math.min(startIdx + wordsPerScene, words.length);
        if (startIdx < words.length) {
          sceneTexts.push(words.slice(startIdx, endIdx).join(' '));
        }
      }
    }
  }
  
  // Process each scene text into a structured Scene object
  return sceneTexts.map((text, index) => {
    const scene = analyzeSceneContent(text, index);
    scene.imagePrompt = generateImagePrompt(scene);
    scene.videoPrompt = generateVideoPrompt(scene);
    return scene;
  });
};

/**
 * Analyzes scene text to extract subjects, actions, locations, objects
 */
const analyzeSceneContent = (sceneText: string, index: number): Scene => {
  const text = sceneText.toLowerCase();
  
  // Basic NLP extraction - in a real system, this would use more sophisticated NLP
  const subjects: string[] = [];
  const actions: string[] = [];
  const locations: string[] = [];
  const objects: string[] = [];
  const emotions: string[] = [];
  
  // Keywords to identify entities
  const locationKeywords = ['in', 'at', 'near', 'inside', 'outside', 'by', 'across'];
  const emotionKeywords = ['happy', 'sad', 'angry', 'excited', 'nervous', 'scared', 'surprised'];
  const articles = ['a', 'the', 'an'];
  
  // Improved extraction logic
  const words = text.split(' ');
  
  // Extract subjects with improved pattern recognition
  // Look for noun phrases like "a dog", "the woman", etc.
  for (let i = 0; i < words.length - 1; i++) {
    if (articles.includes(words[i]) && i + 1 < words.length) {
      // Check if this is an article followed by a noun
      const potentialSubject = words[i + 1];
      
      // Skip if the potential subject is a preposition or common function word
      if (!['in', 'on', 'at', 'by', 'with', 'to', 'from', 'and', 'or'].includes(potentialSubject)) {
        subjects.push(potentialSubject);
      }
    }
  }
  
  // If no subjects were found using the article pattern, try to find the first noun
  if (subjects.length === 0 && words.length > 0) {
    // Skip articles if they are the first word
    let startIndex = 0;
    if (articles.includes(words[0]) && words.length > 1) {
      startIndex = 1;
    }
    subjects.push(words[startIndex]);
  }
  
  // Extract actions (typically verbs)
  const commonVerbs = ['walks', 'goes', 'runs', 'looks', 'takes', 'gives', 'delivers', 
                       'enters', 'exits', 'sits', 'stands', 'chases', 'jumps', 'opens'];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (commonVerbs.includes(word)) {
      actions.push(word);
    }
  }
  
  // Extract locations with improved recognition
  for (const keyword of locationKeywords) {
    const keywordIndex = text.indexOf(` ${keyword} `);
    if (keywordIndex !== -1) {
      const afterKeyword = text.substring(keywordIndex + keyword.length + 2);
      
      // Find the end of this phrase (next preposition or end of string)
      let locationEnd = afterKeyword.length;
      for (const prep of locationKeywords) {
        const prepIndex = afterKeyword.indexOf(` ${prep} `);
        if (prepIndex !== -1 && prepIndex < locationEnd) {
          locationEnd = prepIndex;
        }
      }
      
      const location = afterKeyword.substring(0, locationEnd).trim();
      
      if (location && !locations.includes(location)) {
        locations.push(location);
      }
    }
  }
  
  // Extract objects with improved recognition
  for (let i = 0; i < words.length - 1; i++) {
    // Check for patterns like "a ball", "the package"
    if (articles.includes(words[i]) && i + 1 < words.length) {
      const potentialObject = words[i + 1];
      
      // Don't count it as an object if it's already identified as a subject
      // or it's a common preposition
      if (potentialObject && 
          !subjects.includes(potentialObject) && 
          !['in', 'on', 'at', 'by', 'with', 'to', 'from'].includes(potentialObject)) {
        
        // Don't add duplicate objects
        if (!objects.includes(potentialObject)) {
          objects.push(potentialObject);
        }
      }
    }
  }
  
  // Extract emotions
  for (const emotion of emotionKeywords) {
    if (text.includes(emotion)) {
      emotions.push(emotion);
    }
  }
  
  // Ensure we have at least some fallback values
  if (subjects.length === 0) subjects.push('person');
  if (actions.length === 0) actions.push('is');
  if (locations.length === 0) locations.push('scene');
  
  return {
    id: `scene-${index}`,
    sequence: index + 1,
    description: sceneText,
    subjects,
    actions,
    locations,
    objects,
    emotions,
    imagePrompt: '',  // Will be filled in later
    videoPrompt: ''   // Will be filled in later
  };
};

/**
 * Generates an optimized image prompt based on scene analysis
 */
const generateImagePrompt = (scene: Scene): string => {
  const { subjects, actions, locations, objects, emotions } = scene;
  
  // Combine elements into an effective image generation prompt
  const subjectPhrase = subjects.join(' and ');
  const actionPhrase = actions.join(' and ');
  const locationPhrase = locations.length > 0 ? `in ${locations.join(', ')}` : '';
  const objectPhrase = objects.length > 0 ? `with ${objects.join(' and ')}` : '';
  const emotionPhrase = emotions && emotions.length > 0 ? `feeling ${emotions.join(' and ')}` : '';
  
  // Cinematic prompt enhancers based on scene position
  let cinematicQuality = '';
  
  if (scene.sequence === 1) {
    cinematicQuality = 'establishing shot, detailed environment, depth of field';
  } else if (scene.sequence === 2 || scene.sequence === 3) {
    cinematicQuality = 'mid shot, dramatic lighting, cinematic composition';
  } else {
    cinematicQuality = 'dynamic perspective, high resolution, detailed expressions';
  }
  
  // Build the final prompt
  return `${subjectPhrase} ${actionPhrase} ${locationPhrase} ${objectPhrase} ${emotionPhrase}, ${cinematicQuality}, photorealistic, 4k, detailed texture, volumetric lighting`.trim().replace(/\s+/g, ' ');
};

/**
 * Generates a video animation prompt based on scene analysis
 */
const generateVideoPrompt = (scene: Scene): string => {
  const { subjects, actions, locations, objects } = scene;
  
  // Create a motion-focused prompt
  const mainSubject = subjects[0] || 'subject';
  const mainAction = actions[0] || 'moves';
  const mainLocation = locations[0] || 'scene';
  
  // Motion descriptors based on action type
  let motionType = 'smooth movement';
  
  if (['walks', 'runs', 'goes'].some(verb => actions.includes(verb))) {
    motionType = 'natural walking motion, realistic stride';
  } else if (['delivers', 'gives', 'takes'].some(verb => actions.includes(verb))) {
    motionType = 'hand movement, smooth exchange';
  } else if (['enters', 'exits'].some(verb => actions.includes(verb))) {
    motionType = 'transition from one area to another';
  } else if (['sits', 'stands'].some(verb => actions.includes(verb))) {
    motionType = 'change in posture, natural body mechanics';
  } else if (['chases', 'follows'].some(verb => actions.includes(verb))) {
    motionType = 'dynamic movement, pursuit action';
  } else if (['jumps', 'leaps'].some(verb => actions.includes(verb))) {
    motionType = 'jumping motion, action movement';
  }
  
  // Object interaction if relevant
  const objectInteraction = objects.length > 0 
    ? `interaction with ${objects.join(' and ')}` 
    : '';
  
  // Build the animation prompt
  return `Animate ${mainSubject} ${mainAction} in ${mainLocation}, ${motionType}, ${objectInteraction}, maintain photorealistic quality, 15fps, 3 second clip`.trim().replace(/\s+/g, ' ');
}; 