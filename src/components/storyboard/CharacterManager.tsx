"use client";

import { useState, useEffect } from "react";
import { Character, EmotionType, CharacterPosition } from "@/types/storyboard";
import { v4 as uuidv4 } from "uuid";

interface CharacterManagerProps {
  availableCharacters: Character[];
  activeCharacters: Character[];
  onCharacterAdd: (character: Character) => void;
  onCharacterRemove: (characterId: string) => void;
}

export function CharacterManager({
  availableCharacters,
  activeCharacters,
  onCharacterAdd,
  onCharacterRemove
}: CharacterManagerProps) {
  const [userModels, setUserModels] = useState<Array<{id: string, name: string, imageUrl: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  
  // Fetch user's personalized AI models
  useEffect(() => {
    const fetchUserModels = async () => {
      try {
        const response = await fetch("/api/user/models");
        const data = await response.json();
        
        if (data.success) {
          setUserModels(data.models);
        }
      } catch (error) {
        console.error("Error fetching user models:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserModels();
    
    // For demo purposes, if the API is not yet implemented
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        setUserModels([
          { id: "model1", name: "John Doe", imageUrl: "https://via.placeholder.com/100?text=John" },
          { id: "model2", name: "Jane Smith", imageUrl: "https://via.placeholder.com/100?text=Jane" },
          { id: "model3", name: "Alex Johnson", imageUrl: "https://via.placeholder.com/100?text=Alex" },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, []);
  
  const handleAddCharacter = () => {
    if (!newCharacterName.trim() || !selectedModelId) return;
    
    const modelInfo = userModels.find(model => model.id === selectedModelId);
    if (!modelInfo) return;
    
    const newCharacter: Character = {
      id: uuidv4(),
      name: newCharacterName.trim(),
      modelId: selectedModelId,
      emotion: "neutral" as EmotionType,
      position: "center" as CharacterPosition,
      features: [] // These would be extracted from the model in a real implementation
    };
    
    onCharacterAdd(newCharacter);
    
    // Reset form
    setNewCharacterName("");
    setSelectedModelId("");
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">Character Management</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div>
          {/* Active Characters */}
          {activeCharacters.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3">Active Characters</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {activeCharacters.map(character => {
                  const modelInfo = userModels.find(model => model.id === character.modelId);
                  
                  return (
                    <div 
                      key={character.id} 
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 mb-2">
                        {modelInfo && (
                          <img 
                            src={modelInfo.imageUrl} 
                            alt={character.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback for missing images
                              e.currentTarget.src = "https://via.placeholder.com/100?text=User";
                            }}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate w-full text-center">{character.name}</span>
                      <button
                        onClick={() => onCharacterRemove(character.id)}
                        className="mt-2 text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Add New Character */}
          <div>
            <h3 className="text-md font-semibold mb-3">Add New Character</h3>
            
            {userModels.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You don&apos;t have any personalized AI models yet. 
                  Create a model first to add characters to your storyboard.
                </p>
                <a 
                  href="/models/create" 
                  className="mt-2 inline-block text-sm font-medium text-blue-500 hover:text-blue-700"
                >
                  Create a personalized model →
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Character Name
                  </label>
                  <input
                    id="characterName"
                    type="text"
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter character name"
                  />
                </div>
                
                <div>
                  <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Model
                  </label>
                  <div className="flex">
                    <select
                      id="modelSelect"
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a model</option>
                      {userModels.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddCharacter}
                      disabled={!newCharacterName.trim() || !selectedModelId}
                      className={`px-4 py-2 rounded-r-md ${
                        !newCharacterName.trim() || !selectedModelId
                        ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Available Models Preview */}
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3">Your Available Models</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {userModels.map(model => (
                  <div 
                    key={model.id} 
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex flex-col items-center cursor-pointer ${
                      selectedModelId === model.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedModelId(model.id)}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 mb-2">
                      <img 
                        src={model.imageUrl} 
                        alt={model.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for missing images
                          e.currentTarget.src = "https://via.placeholder.com/100?text=User";
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium truncate w-full text-center">{model.name}</span>
                  </div>
                ))}
                
                <a 
                  href="/models/create" 
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex flex-col items-center justify-center h-[96px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">New Model</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 