"use client";

import { useState, useEffect } from "react";
import { Scene, Character, ShotType, EmotionType, CharacterPosition } from "@/types/storyboard";
import { ShotTypeGuide } from "./ShotTypeGuide";
import { EmotionGuide } from "./EmotionGuide";

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  availableCharacters: Character[];
  onUpdate: (scene: Scene) => void;
  onGenerateKeyframe: () => void;
  onDelete: () => void;
}

export function SceneCard({
  scene,
  isSelected,
  availableCharacters,
  onUpdate,
  onGenerateKeyframe,
  onDelete
}: SceneCardProps) {
  const [isShowingShotGuide, setIsShowingShotGuide] = useState(false);
  const [isShowingEmotionGuide, setIsShowingEmotionGuide] = useState(false);
  
  const updateSceneField = <K extends keyof Scene>(field: K, value: Scene[K]) => {
    onUpdate({
      ...scene,
      [field]: value
    });
  };
  
  const addCharacterToScene = (characterId: string) => {
    const characterToAdd = availableCharacters.find(c => c.id === characterId);
    if (!characterToAdd) return;
    
    // Check if character is already in the scene
    if (scene.characters.some(c => c.id === characterId)) return;
    
    onUpdate({
      ...scene,
      characters: [
        ...scene.characters,
        {
          id: characterToAdd.id,
          name: characterToAdd.name,
          modelId: characterToAdd.modelId,
          emotion: "neutral" as EmotionType,
          position: "center" as CharacterPosition
        }
      ]
    });
  };
  
  const removeCharacterFromScene = (characterId: string) => {
    onUpdate({
      ...scene,
      characters: scene.characters.filter(c => c.id !== characterId)
    });
  };
  
  const updateCharacterInScene = (characterId: string, updates: Partial<Character>) => {
    onUpdate({
      ...scene,
      characters: scene.characters.map(c => 
        c.id === characterId ? { ...c, ...updates } : c
      )
    });
  };

  const shotTypeOptions: ShotType[] = [
    "establishing",
    "wide",
    "medium",
    "close-up",
    "extreme-close-up",
    "overhead",
    "drone"
  ];
  
  const emotionOptions: EmotionType[] = [
    "joy",
    "sadness",
    "anger",
    "fear",
    "surprise",
    "disgust",
    "neutral",
    "thoughtful",
    "confident",
    "confused",
    "anxious",
    "excited"
  ];
  
  const positionOptions: CharacterPosition[] = [
    "foreground",
    "background",
    "left",
    "right",
    "center"
  ];
  
  const isGenerateDisabled = !scene.description || !scene.setting || scene.characters.length === 0;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Scene {scene.sequenceNumber + 1}</span>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
            aria-label="Delete scene"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Scene description */}
        <div className="mb-4">
          <label htmlFor={`description-${scene.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id={`description-${scene.id}`}
            value={scene.description}
            onChange={(e) => updateSceneField("description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Describe what happens in this scene"
            rows={2}
          />
        </div>
        
        {/* Setting */}
        <div className="mb-4">
          <label htmlFor={`setting-${scene.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Setting
          </label>
          <input
            id={`setting-${scene.id}`}
            type="text"
            value={scene.setting}
            onChange={(e) => updateSceneField("setting", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Where does this scene take place?"
          />
        </div>
        
        {/* Shot type with guide */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor={`shotType-${scene.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shot Type
            </label>
            <button
              type="button"
              onClick={() => setIsShowingShotGuide(!isShowingShotGuide)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              {isShowingShotGuide ? "Hide Guide" : "Show Guide"}
            </button>
          </div>
          <select
            id={`shotType-${scene.id}`}
            value={scene.shotType}
            onChange={(e) => updateSceneField("shotType", e.target.value as ShotType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {shotTypeOptions.map(type => (
              <option key={type} value={type}>
                {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          
          {isShowingShotGuide && <ShotTypeGuide onSelect={(type) => updateSceneField("shotType", type)} />}
        </div>
        
        {/* Characters */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Characters
            </label>
            <div className="relative">
              <select
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded cursor-pointer"
                onChange={(e) => {
                  if (e.target.value) {
                    addCharacterToScene(e.target.value);
                    e.target.value = ""; // Reset select
                  }
                }}
                value=""
              >
                <option value="">Add Character</option>
                {availableCharacters
                  .filter(char => !scene.characters.some(c => c.id === char.id))
                  .map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))
                }
              </select>
            </div>
          </div>
          
          {scene.characters.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No characters added yet</p>
          ) : (
            <div className="space-y-3">
              {scene.characters.map(character => (
                <div key={character.id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{character.name}</span>
                    <button
                      onClick={() => removeCharacterFromScene(character.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Remove ${character.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Emotion</label>
                      <div className="flex items-center">
                        <select
                          value={character.emotion}
                          onChange={(e) => updateCharacterInScene(character.id, { emotion: e.target.value as EmotionType })}
                          className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        >
                          {emotionOptions.map(emotion => (
                            <option key={emotion} value={emotion}>
                              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsShowingEmotionGuide(!isShowingEmotionGuide)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position</label>
                      <select
                        value={character.position}
                        onChange={(e) => updateCharacterInScene(character.id, { position: e.target.value as CharacterPosition })}
                        className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        {positionOptions.map(position => (
                          <option key={position} value={position}>
                            {position.charAt(0).toUpperCase() + position.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isShowingEmotionGuide && <EmotionGuide onSelect={(emotion) => {
            if (scene.characters.length > 0) {
              updateCharacterInScene(scene.characters[0].id, { emotion });
            }
          }} />}
        </div>
      </div>
      
      {/* Keyframe preview or generation button */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        {scene.keyframeImageUrl ? (
          <div className="relative">
            <img 
              src={scene.keyframeImageUrl} 
              alt={`Keyframe for scene ${scene.sequenceNumber + 1}`}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={onGenerateKeyframe}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Regenerate
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 flex justify-center">
            <button
              onClick={onGenerateKeyframe}
              disabled={isGenerateDisabled || scene.generationStatus === "generating"}
              className={`px-4 py-2 rounded-md ${
                isGenerateDisabled || scene.generationStatus === "generating"
                  ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {scene.generationStatus === "generating" ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : scene.generationStatus === "failed" ? (
                "Retry Generation"
              ) : (
                "Generate Keyframe"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 