"use client";

import { ShotType } from "@/types/storyboard";

interface ShotTypeGuideProps {
  onSelect?: (shotType: ShotType) => void;
}

export function ShotTypeGuide({ onSelect }: ShotTypeGuideProps) {
  const shotTypes = [
    {
      name: "establishing" as ShotType,
      description: "Wide view showing the entire setting and context",
      example: "/images/shot-types/establishing.jpg",
      promptTerms: ["wide establishing shot", "setting context", "full environment"]
    },
    {
      name: "wide" as ShotType,
      description: "Shows the subject and their surroundings",
      example: "/images/shot-types/wide.jpg",
      promptTerms: ["wide shot", "full body", "environmental context"]
    },
    {
      name: "medium" as ShotType,
      description: "Shows character from waist up, good for dialogue",
      example: "/images/shot-types/medium.jpg",
      promptTerms: ["medium shot", "waist up", "mid-shot", "conversational framing"]
    },
    {
      name: "close-up" as ShotType,
      description: "Focuses on face or detail, shows emotion",
      example: "/images/shot-types/close-up.jpg",
      promptTerms: ["close-up shot", "facial detail", "emotional focus"]
    },
    {
      name: "extreme-close-up" as ShotType,
      description: "Very tight focus on a detail or expression",
      example: "/images/shot-types/extreme-close-up.jpg",
      promptTerms: ["extreme close-up", "macro shot", "intense detail"]
    },
    {
      name: "overhead" as ShotType,
      description: "View from directly above the subject",
      example: "/images/shot-types/overhead.jpg",
      promptTerms: ["overhead shot", "bird's-eye view", "top-down perspective"]
    },
    {
      name: "drone" as ShotType,
      description: "Aerial view, often moving or sweeping",
      example: "/images/shot-types/drone.jpg",
      promptTerms: ["drone shot", "aerial view", "sweeping landscape"]
    }
  ];
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mt-2 max-h-60 overflow-y-auto">
      <h3 className="text-sm font-medium mb-2">Shot Type Reference</h3>
      <div className="grid grid-cols-1 gap-3">
        {shotTypes.map(shot => (
          <div 
            key={shot.name}
            className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            onClick={() => onSelect && onSelect(shot.name)}
          >
            <div className="flex items-center">
              {shot.example && (
                <div className="w-16 h-12 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden mr-2 flex-shrink-0">
                  <img 
                    src={shot.example} 
                    alt={`Example of ${shot.name} shot`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback for missing images
                      e.currentTarget.src = "https://via.placeholder.com/64x48?text=Shot";
                    }}
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {shot.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{shot.description}</p>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Prompt: {shot.promptTerms.join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 