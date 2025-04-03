"use client";

import { EmotionType } from "@/types/storyboard";

interface EmotionGuideProps {
  onSelect?: (emotion: EmotionType) => void;
}

export function EmotionGuide({ onSelect }: EmotionGuideProps) {
  const emotions = [
    { 
      name: "joy" as EmotionType, 
      description: "Smiling, bright eyes, relaxed face", 
      promptTerms: ["joyful", "happy", "smiling broadly", "gleeful expression"] 
    },
    { 
      name: "sadness" as EmotionType, 
      description: "Downturned mouth, drooping eyes, furrowed brow", 
      promptTerms: ["sad", "sorrowful", "melancholy expression", "downcast eyes"] 
    },
    { 
      name: "anger" as EmotionType, 
      description: "Furrowed brow, tight jaw, intense eyes", 
      promptTerms: ["angry", "furious", "enraged expression", "scowling"] 
    },
    { 
      name: "fear" as EmotionType, 
      description: "Wide eyes, tense face, possibly recoiling", 
      promptTerms: ["fearful", "terrified", "eyes wide with fear", "frightened expression"] 
    },
    { 
      name: "surprise" as EmotionType, 
      description: "Raised eyebrows, wide eyes, open mouth", 
      promptTerms: ["surprised", "shocked", "astonished expression", "mouth agape"] 
    },
    { 
      name: "disgust" as EmotionType, 
      description: "Wrinkled nose, raised upper lip, squinted eyes", 
      promptTerms: ["disgusted", "repulsed", "revolted expression", "grimacing"] 
    },
    { 
      name: "neutral" as EmotionType, 
      description: "Relaxed face, natural expression, no strong emotion", 
      promptTerms: ["neutral expression", "composed face", "relaxed countenance"] 
    },
    { 
      name: "thoughtful" as EmotionType, 
      description: "Slight frown, distant gaze, hand near face", 
      promptTerms: ["thoughtful", "contemplative", "pensive expression", "reflective gaze"] 
    },
    { 
      name: "confident" as EmotionType, 
      description: "Upright posture, slight smile, direct gaze", 
      promptTerms: ["confident", "self-assured", "poised expression", "assertive stance"] 
    },
    { 
      name: "confused" as EmotionType, 
      description: "Tilted head, furrowed brow, pursed lips", 
      promptTerms: ["confused", "puzzled", "perplexed expression", "furrowed brow"] 
    },
    { 
      name: "anxious" as EmotionType, 
      description: "Tense posture, worried eyes, fidgeting", 
      promptTerms: ["anxious", "worried", "nervous expression", "uneasy demeanor"] 
    },
    { 
      name: "excited" as EmotionType, 
      description: "Wide smile, animated expression, energetic posture", 
      promptTerms: ["excited", "thrilled", "enthusiastic expression", "animated face"] 
    }
  ];
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mt-2 max-h-60 overflow-y-auto">
      <h3 className="text-sm font-medium mb-2">Emotion Reference</h3>
      <div className="grid grid-cols-2 gap-2">
        {emotions.map(emotion => (
          <div 
            key={emotion.name}
            className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            onClick={() => onSelect && onSelect(emotion.name)}
          >
            <p className="text-sm font-medium">
              {emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{emotion.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
              Prompt: {emotion.promptTerms.slice(0, 2).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 