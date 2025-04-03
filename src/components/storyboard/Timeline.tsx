"use client";

import { useState, useRef, useEffect } from "react";
import { Scene } from "@/types/storyboard";

interface StoryboardTimelineProps {
  scenes: Scene[];
  onSceneSelect: (sceneId: string) => void;
  onReorder: (reorderedScenes: Scene[]) => void;
  onGenerateVideo: () => void;
  isGenerating: boolean;
}

export function StoryboardTimeline({
  scenes,
  onSceneSelect,
  onReorder,
  onGenerateVideo,
  isGenerating
}: StoryboardTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [, setIsDragging] = useState(false);
  
  // Update timeline width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener("resize", updateWidth);
    
    return () => window.removeEventListener("resize", updateWidth);
  }, []);
  
  // Sort scenes by sequence number
  const sortedScenes = [...scenes].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  // Calculate scene widths proportionally
  const totalTime = Math.max(...scenes.map(s => s.timestamp + 2), 2); // 2 seconds per scene
  const getSceneWidth = (scene: Scene) => {
    // Each scene is 2 seconds long
    return `${(2 / totalTime) * 100}%`;
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sceneId: string) => {
    setDraggedSceneId(sceneId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox
    e.dataTransfer.setData("text/plain", sceneId);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, sceneId: string) => {
    e.preventDefault();
    
    if (!draggedSceneId || draggedSceneId === sceneId) return;
    
    const draggedScene = scenes.find(s => s.id === draggedSceneId);
    const targetScene = scenes.find(s => s.id === sceneId);
    
    if (!draggedScene || !targetScene) return;
    
    // Reorder the scenes
    const newScenes = [...scenes];
    const draggedIndex = newScenes.findIndex(s => s.id === draggedSceneId);
    const targetIndex = newScenes.findIndex(s => s.id === sceneId);
    
    newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, draggedScene);
    
    onReorder(newScenes);
  };
  
  const handleDragEnd = () => {
    setDraggedSceneId(null);
    setIsDragging(false);
  };
  
  const validSceneCount = scenes.filter(scene => 
    scene.keyframeImageUrl && scene.generationStatus === "complete"
  ).length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Storyboard Timeline</h2>
        <button
          onClick={onGenerateVideo}
          disabled={validSceneCount < 2 || isGenerating}
          className={`px-4 py-2 rounded-md ${
            validSceneCount < 2 || isGenerating
              ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
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
            `Generate Video (${validSceneCount} keyframes)`
          )}
        </button>
      </div>
      
      {scenes.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Your storyboard is empty. Add scenes to create your video.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4" ref={timelineRef}>
          <div className="min-w-full">
            {/* Timeline ruler */}
            <div className="flex text-xs text-gray-500 dark:text-gray-400 mb-1">
              {Array.from({ length: Math.ceil(totalTime) }).map((_, i) => (
                <div key={i} className="flex-shrink-0" style={{ width: `${(1 / totalTime) * 100}%` }}>
                  {i}s
                </div>
              ))}
            </div>
            
            {/* Timeline scenes */}
            <div className="flex h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {sortedScenes.map((scene) => (
                <div
                  key={scene.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, scene.id)}
                  onDragOver={(e) => handleDragOver(e, scene.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSceneSelect(scene.id)}
                  style={{ width: getSceneWidth(scene) }}
                  className={`flex-shrink-0 h-full border-r border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex flex-col ${
                    draggedSceneId === scene.id ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <div className="h-6 bg-blue-500 dark:bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                    Scene {scene.sequenceNumber + 1}
                  </div>
                  <div className="flex-grow flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 relative">
                    {scene.keyframeImageUrl ? (
                      <img 
                        src={scene.keyframeImageUrl} 
                        alt={`Keyframe for scene ${scene.sequenceNumber + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1 text-center h-full w-full">
                        {scene.generationStatus === "generating" ? (
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : scene.generationStatus === "failed" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <div className="text-gray-400 dark:text-gray-500 text-[9px]">No keyframe</div>
                        )}
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 text-[8px] text-white bg-black bg-opacity-60 p-[2px] truncate">
                      {scene.description.substring(0, 30)}{scene.description.length > 30 ? "..." : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Drag scenes to reorder. Each scene represents approximately 2 seconds in the final video.</p>
        {validSceneCount < 2 && scenes.length > 0 && (
          <p className="text-yellow-500 dark:text-yellow-400 mt-1">
            Generate at least 2 keyframes to create a video.
          </p>
        )}
      </div>
    </div>
  );
} 