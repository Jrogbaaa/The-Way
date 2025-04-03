"use client";

import { useState, useCallback, useRef, ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { Scene, Character, ShotType, EmotionType } from "@/types/storyboard";
import { VideoPreview } from "../video/VideoPreview";

export function StoryboardCreator() {
  const [storyboardTitle, setStoryboardTitle] = useState<string>("");
  const [storyboardDescription, setStoryboardDescription] = useState<string>("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [mainCharacter, setMainCharacter] = useState<Character | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedVideoSceneIndex, setSelectedVideoSceneIndex] = useState<number>(0);
  const mainCharacterFileInputRef = useRef<HTMLInputElement>(null);
  const sceneFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Initialize with first scene if no scenes exist
  const initializeFirstScene = useCallback(() => {
    if (scenes.length === 0) {
      handleAddScene();
    }
  }, [scenes.length]);

  // Handle main character image upload
  const handleMainCharacterImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      // Create main character with uploaded image
      const newCharacter: Character = {
        id: uuidv4(),
        name: "Main Character",
        modelId: "custom-uploaded",
        emotion: "neutral",
        position: "center",
        imageUrl: imageUrl // Add custom property for uploaded image
      };
      
      setMainCharacter(newCharacter);
      
      // Update all scenes to include this character
      setScenes(prev => prev.map(scene => ({
        ...scene,
        characters: [
          ...scene.characters.filter(c => c.id !== newCharacter.id),
          { ...newCharacter }
        ]
      })));
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Handle scene image upload
  const handleSceneImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>, sceneIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      setScenes(prev => prev.map((scene, index) => 
        index === sceneIndex 
          ? { 
              ...scene, 
              keyframeImageUrl: imageUrl, 
              generationStatus: "complete",
              uploadedImage: true // Flag to indicate this was uploaded, not generated
            } 
          : scene
      ));
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Add a new scene
  const handleAddScene = useCallback(() => {
    const newScene: Scene = {
      id: uuidv4(),
      description: "",
      shotType: "medium" as ShotType,
      characters: mainCharacter ? [{ ...mainCharacter }] : [],
      setting: "",
      generationStatus: "pending",
      sequenceNumber: scenes.length,
      timestamp: scenes.length * 2 // 2 seconds per scene
    };
    
    setScenes(prev => [...prev, newScene]);
    setCurrentSceneIndex(scenes.length);
  }, [scenes.length, mainCharacter]);
  
  // Update scene fields
  const updateSceneField = useCallback(<K extends keyof Scene>(sceneIndex: number, field: K, value: Scene[K]) => {
    setScenes(prev => prev.map((scene, index) => 
      index === sceneIndex ? { ...scene, [field]: value } : scene
    ));
  }, []);
  
  // Generate keyframe for a scene
  const handleGenerateKeyframe = useCallback(async (sceneIndex: number) => {
    const sceneToGenerate = scenes[sceneIndex];
    if (!sceneToGenerate) return;
    
    // Find the previous scene for consistency reference
    const previousScene = scenes.find(scene => 
      scene.sequenceNumber === sceneToGenerate.sequenceNumber - 1 &&
      scene.keyframeImageUrl
    );
    
    // Update scene status to generating
    setScenes(prev => prev.map((scene, index) => 
      index === sceneIndex ? { ...scene, generationStatus: "generating" } : scene
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
        setScenes(prev => prev.map((scene, index) => 
          index === sceneIndex ? { 
            ...scene, 
            keyframeImageUrl: data.keyframeUrl,
            generationStatus: "complete",
            generationParameters: data.metadata,
            uploadedImage: false
          } : scene
        ));
      } else {
        setScenes(prev => prev.map((scene, index) => 
          index === sceneIndex ? { ...scene, generationStatus: "failed" } : scene
        ));
      }
    } catch (error) {
      console.error("Error generating keyframe:", error);
      setScenes(prev => prev.map((scene, index) => 
        index === sceneIndex ? { ...scene, generationStatus: "failed" } : scene
      ));
    }
  }, [scenes]);

  // Navigate to previous scene
  const handlePreviousScene = useCallback(() => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  }, [currentSceneIndex]);

  // Navigate to next scene
  const handleNextScene = useCallback(() => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    } else {
      // Add a new scene if at the end
      handleAddScene();
    }
  }, [currentSceneIndex, scenes.length, handleAddScene]);

  // Generate video from keyframes
  const handleGenerateVideo = useCallback(async () => {
    // Filter scenes with successful keyframe generation
    const validScenes = scenes
      .filter(scene => scene.generationStatus === "complete" && scene.keyframeImageUrl)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    if (validScenes.length < 2) {
      alert("Please add at least 2 scenes with images before creating a video");
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
        setSelectedVideoSceneIndex(0);
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

  // Delete scene
  const handleDeleteScene = useCallback((sceneIndex: number) => {
    setScenes(prev => {
      const newScenes = prev.filter((_, index) => index !== sceneIndex);
      
      // Resequence the scenes
      return newScenes.map((scene, index) => ({
        ...scene,
        sequenceNumber: index,
        timestamp: index * 2
      }));
    });
    
    // Adjust current scene index if needed
    if (sceneIndex <= currentSceneIndex) {
      setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1));
    }
  }, [currentSceneIndex]);

  // Initialize first scene if none exists
  if (scenes.length === 0) {
    initializeFirstScene();
  }

  // Get current scene
  const currentScene = scenes[currentSceneIndex] || null;
  const disableGenerate = currentScene && (!currentScene.description || !currentScene.setting);
  const validSceneCount = scenes.filter(scene => scene.generationStatus === "complete").length;

  return (
    <div className="flex flex-col gap-8">
      {/* Project Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video Title
            </label>
            <input
              id="title"
              type="text"
              value={storyboardTitle}
              onChange={(e) => setStoryboardTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter title for your video"
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
              placeholder="Describe what this video is about"
            />
          </div>
        </div>
      </div>
      
      {/* Step 1: Main Character Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Step 1: Upload Main Character Image</h2>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/3">
            <div 
              onClick={() => mainCharacterFileInputRef.current?.click()}
              className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer
                ${mainCharacter ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-gray-300 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'} 
                hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors p-4`}
            >
              {mainCharacter?.imageUrl ? (
                <div className="relative w-full h-full">
                  <img 
                    src={mainCharacter.imageUrl} 
                    alt="Main character" 
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity">
                    <span className="text-white opacity-0 hover:opacity-100 transition-opacity">
                      Change Image
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-center">Upload your main character image</span>
                </>
              )}
              <input 
                type="file" 
                ref={mainCharacterFileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleMainCharacterImageUpload} 
              />
            </div>
          </div>
          <div className="w-full md:w-2/3 flex flex-col justify-center">
            <h3 className="text-lg font-medium mb-2">
              {mainCharacter ? 'Great! Your main character is ready' : 'Add your main character'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This character will appear consistently throughout all scenes in your video.
              Upload a high-quality image with clear facial features for best results.
            </p>
            {!mainCharacter && (
              <button
                onClick={() => mainCharacterFileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors w-full md:w-auto"
              >
                Upload Character Image
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Step 2+: Scene Builder with Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Step {mainCharacter ? 2 : 1}: Create Scene {currentSceneIndex + 1}</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousScene}
              disabled={currentSceneIndex === 0}
              className={`p-2 rounded-md ${
                currentSceneIndex === 0 
                  ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
              aria-label="Previous scene"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              Scene {currentSceneIndex + 1} of {scenes.length}
            </span>
            <button
              onClick={handleNextScene}
              className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
              aria-label="Next scene"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {currentScene && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scene details */}
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor={`description-${currentSceneIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scene Description
                </label>
                <textarea
                  id={`description-${currentSceneIndex}`}
                  value={currentScene.description}
                  onChange={(e) => updateSceneField(currentSceneIndex, "description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Describe what happens in this scene"
                  rows={2}
                />
              </div>
              
              <div>
                <label htmlFor={`setting-${currentSceneIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scene Setting
                </label>
                <input
                  id={`setting-${currentSceneIndex}`}
                  type="text"
                  value={currentScene.setting}
                  onChange={(e) => updateSceneField(currentSceneIndex, "setting", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Where does this scene take place?"
                />
              </div>
              
              <div>
                <label htmlFor={`shotType-${currentSceneIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shot Type
                </label>
                <select
                  id={`shotType-${currentSceneIndex}`}
                  value={currentScene.shotType}
                  onChange={(e) => updateSceneField(currentSceneIndex, "shotType", e.target.value as ShotType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="establishing">Establishing</option>
                  <option value="wide">Wide</option>
                  <option value="medium">Medium</option>
                  <option value="close-up">Close-up</option>
                  <option value="extreme-close-up">Extreme Close-up</option>
                  <option value="overhead">Overhead</option>
                  <option value="drone">Drone</option>
                </select>
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => sceneFileInputRefs.current[currentSceneIndex]?.click()}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Upload Scene Image
                </button>
                <input 
                  type="file" 
                  ref={(el) => { sceneFileInputRefs.current[currentSceneIndex] = el; }}
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleSceneImageUpload(e, currentSceneIndex)} 
                />
                
                <button
                  onClick={() => handleGenerateKeyframe(currentSceneIndex)}
                  disabled={disableGenerate}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    disableGenerate
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {currentScene.generationStatus === 'generating' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : 'Generate AI Image'}
                </button>
              </div>
              
              {!currentScene.keyframeImageUrl && !disableGenerate && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  <p>No image? You can either upload your own or generate one with our AI model.</p>
                </div>
              )}
              
              <div className="flex justify-between mt-2">
                {scenes.length > 1 && (
                  <button
                    onClick={() => handleDeleteScene(currentSceneIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete Scene
                  </button>
                )}
                
                <button
                  onClick={handleNextScene}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 py-2 px-4 rounded-md transition-colors ml-auto"
                >
                  {currentSceneIndex < scenes.length - 1 ? 'Next Scene' : 'Add New Scene'}
                </button>
              </div>
            </div>
            
            {/* Scene preview */}
            <div className="flex flex-col">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                {currentScene.keyframeImageUrl ? (
                  <img 
                    src={currentScene.keyframeImageUrl} 
                    alt={`Scene ${currentSceneIndex + 1}`} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {currentScene.generationStatus === 'generating' ? (
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">Generating image...</p>
                      </div>
                    ) : currentScene.generationStatus === 'failed' ? (
                      <div className="flex flex-col items-center text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>Generation failed. Please try again.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">
                          No image yet. Upload or generate an image for this scene.
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                          Each scene represents approximately 2 seconds in the final video.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Scene Timeline Position:</span> {currentScene.timestamp} - {currentScene.timestamp + 2} seconds
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Scene Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scene Overview</h2>
          <button
            onClick={handleGenerateVideo}
            disabled={validSceneCount < 2 || isGenerating}
            className={`px-4 py-2 rounded-md ${
              validSceneCount < 2 || isGenerating
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Video...
              </span>
            ) : (
              `Generate Video (${validSceneCount} scenes)`
            )}
          </button>
        </div>
        
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-0">
            {scenes.map((scene, index) => (
              <div 
                key={scene.id}
                onClick={() => setCurrentSceneIndex(index)}
                className={`flex-shrink-0 w-24 md:w-32 cursor-pointer rounded-lg overflow-hidden border-2 ${
                  currentSceneIndex === index 
                    ? 'border-blue-500' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                  {scene.keyframeImageUrl ? (
                    <img 
                      src={scene.keyframeImageUrl} 
                      alt={`Scene ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {scene.generationStatus === 'generating' ? (
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : 'No image'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                    Scene {index + 1}
                  </div>
                </div>
              </div>
            ))}
            
            <div 
              onClick={handleAddScene}
              className="flex-shrink-0 w-24 md:w-32 aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
        
        {validSceneCount < 2 && scenes.length > 0 && (
          <p className="text-yellow-500 dark:text-yellow-400 text-sm mt-2">
            Add images to at least 2 scenes to create a video.
          </p>
        )}
      </div>
      
      {/* Video Preview */}
      {videoUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">Video Preview</h2>
          
          <VideoPreview 
            videoUrl={videoUrl} 
            keyframeData={scenes
              .filter(scene => scene.generationStatus === "complete" && scene.keyframeImageUrl)
              .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
              .map(scene => ({
                timestamp: scene.timestamp,
                imageUrl: scene.keyframeImageUrl as string,
                description: scene.description
              }))}
            onEditScene={(timestamp) => {
              const sceneIndex = scenes.findIndex(s => s.timestamp === timestamp);
              if (sceneIndex !== -1) {
                setCurrentSceneIndex(sceneIndex);
              }
            }}
          />
          
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Video Length:</span> {scenes.length * 2} seconds
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium">Number of Scenes:</span> {scenes.filter(scene => scene.generationStatus === "complete").length}
            </p>
            {mainCharacter && (
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium mr-2">Main Character:</span>
                {mainCharacter.imageUrl && (
                  <img 
                    src={mainCharacter.imageUrl} 
                    alt="Main character" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 