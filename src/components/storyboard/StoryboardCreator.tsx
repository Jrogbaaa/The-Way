"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Scene, Character, ShotType, EmotionType } from "@/types/storyboard";
import { SceneCard } from "./SceneCard";
import { CharacterManager } from "./CharacterManager";
import { StoryboardTimeline } from "./Timeline";
import { VideoPreview } from "../video/VideoPreview";

export function StoryboardCreator() {
  const [storyboardTitle, setStoryboardTitle] = useState<string>("");
  const [storyboardDescription, setStoryboardDescription] = useState<string>("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [activeCharacters, setActiveCharacters] = useState<Character[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const handleAddScene = useCallback(() => {
    const newScene: Scene = {
      id: uuidv4(),
      description: "",
      shotType: "medium" as ShotType,
      characters: [],
      setting: "",
      generationStatus: "pending",
      sequenceNumber: scenes.length,
      timestamp: scenes.length * 2 // 2 seconds per scene
    };
    
    setScenes(prev => [...prev, newScene]);
    setSelectedSceneId(newScene.id);
  }, [scenes.length]);
  
  const handleUpdateScene = useCallback((updatedScene: Scene) => {
    setScenes(prev => prev.map(scene => 
      scene.id === updatedScene.id ? updatedScene : scene
    ));
  }, []);
  
  const handleDeleteScene = useCallback((sceneId: string) => {
    setScenes(prev => {
      const filteredScenes = prev.filter(scene => scene.id !== sceneId);
      
      // Resequence remaining scenes
      return filteredScenes.map((scene, index) => ({
        ...scene,
        sequenceNumber: index,
        timestamp: index * 2 // 2 seconds per scene
      }));
    });
    
    if (selectedSceneId === sceneId) {
      setSelectedSceneId(null);
    }
  }, [selectedSceneId]);
  
  const handleReorderScenes = useCallback((reorderedScenes: Scene[]) => {
    // Update sequence numbers and timestamps
    const updatedScenes = reorderedScenes.map((scene, index) => ({
      ...scene,
      sequenceNumber: index,
      timestamp: index * 2 // 2 seconds per scene
    }));
    
    setScenes(updatedScenes);
  }, []);

  const handleGenerateKeyframe = useCallback(async (sceneId: string) => {
    const sceneToGenerate = scenes.find(scene => scene.id === sceneId);
    if (!sceneToGenerate) return;
    
    // Find the previous scene for consistency reference
    const previousScene = scenes.find(scene => 
      scene.sequenceNumber === sceneToGenerate.sequenceNumber - 1 &&
      scene.keyframeImageUrl
    );
    
    // Update scene status to generating
    setScenes(prev => prev.map(scene => 
      scene.id === sceneId ? { ...scene, generationStatus: "generating" } : scene
    ));
    
    try {
      const response = await fetch("/api/storyboard/generate-keyframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDescription: sceneToGenerate.description,
          characters: sceneToGenerate.characters,
          shotType: sceneToGenerate.shotType,
          setting: sceneToGenerate.setting,
          previousKeyframeUrl: previousScene?.keyframeImageUrl
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId ? { 
            ...scene, 
            keyframeImageUrl: data.keyframeUrl,
            generationStatus: "complete",
            generationParameters: data.metadata
          } : scene
        ));
      } else {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId ? { ...scene, generationStatus: "failed" } : scene
        ));
      }
    } catch (error) {
      console.error("Error generating keyframe:", error);
      setScenes(prev => prev.map(scene => 
        scene.id === sceneId ? { ...scene, generationStatus: "failed" } : scene
      ));
    }
  }, [scenes]);

  const handleGenerateVideo = useCallback(async () => {
    // Filter scenes with successful keyframe generation
    const validScenes = scenes
      .filter(scene => scene.generationStatus === "complete" && scene.keyframeImageUrl)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    if (validScenes.length < 2) {
      alert("Please generate at least 2 keyframes before creating a video");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const keyframes = validScenes.map(scene => ({
        imageUrl: scene.keyframeImageUrl as string,
        timestamp: scene.timestamp,
        characters: scene.characters.map(char => char.id),
        sceneMetadata: scene.generationParameters || {}
      }));
      
      const response = await fetch("/api/storyboard/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyframes,
          options: {
            fps: 30,
            resolution: "1080p",
            quality: "standard",
            transitionStyle: "morph"
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVideoUrl(data.videoUrl);
      } else {
        alert("Failed to generate video: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error generating video:", error);
      alert("An error occurred while generating the video");
    } finally {
      setIsGenerating(false);
    }
  }, [scenes]);

  return (
    <div className="flex flex-col gap-8">
      {/* Storyboard details section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storyboard Title
            </label>
            <input
              id="title"
              type="text"
              value={storyboardTitle}
              onChange={(e) => setStoryboardTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter title for your storyboard"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={storyboardDescription}
              onChange={(e) => setStoryboardDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-[43px]"
              placeholder="Describe what this storyboard is about"
            />
          </div>
        </div>
      </div>

      {/* Character management section */}
      <CharacterManager
        availableCharacters={availableCharacters}
        activeCharacters={activeCharacters}
        onCharacterAdd={(character) => setActiveCharacters(prev => [...prev, character])}
        onCharacterRemove={(characterId) => setActiveCharacters(prev => prev.filter(c => c.id !== characterId))}
      />

      {/* Timeline view */}
      <StoryboardTimeline
        scenes={scenes}
        onSceneSelect={setSelectedSceneId}
        onReorder={handleReorderScenes}
        onGenerateVideo={handleGenerateVideo}
        isGenerating={isGenerating}
      />

      {/* Scenes management */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isSelected={selectedSceneId === scene.id}
            availableCharacters={activeCharacters}
            onUpdate={handleUpdateScene}
            onGenerateKeyframe={() => handleGenerateKeyframe(scene.id)}
            onDelete={() => handleDeleteScene(scene.id)}
          />
        ))}
        
        <div 
          onClick={handleAddScene}
          className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 h-[300px] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-gray-600 dark:text-gray-300 font-medium">Add New Scene</span>
        </div>
      </div>

      {/* Video preview section */}
      {videoUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Video</h2>
          <VideoPreview 
            videoUrl={videoUrl} 
            keyframeData={scenes
              .filter(s => s.generationStatus === "complete" && s.keyframeImageUrl)
              .map(s => ({
                timestamp: s.timestamp,
                imageUrl: s.keyframeImageUrl as string,
                description: s.description
              }))}
            onEditScene={(timestamp) => {
              const scene = scenes.find(s => s.timestamp === timestamp);
              if (scene) setSelectedSceneId(scene.id);
            }}
          />
        </div>
      )}
    </div>
  );
} 