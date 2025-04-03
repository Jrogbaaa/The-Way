"use client";

import { useState, useRef, useEffect } from "react";

interface KeyframePreview {
  timestamp: number;
  imageUrl: string;
  description?: string;
}

interface VideoPreviewProps {
  videoUrl: string;
  keyframeData: KeyframePreview[];
  onExport?: (options: { resolution: string; format: string }) => void;
  onEditScene?: (timestamp: number) => void;
}

export function VideoPreview({
  videoUrl,
  keyframeData,
  onExport,
  onEditScene
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportFormat, setExportFormat] = useState<"mp4" | "webm" | "gif">("mp4");
  const [exportResolution, setExportResolution] = useState<"720p" | "1080p" | "480p">("720p");
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Sort keyframes by timestamp
  const sortedKeyframes = [...keyframeData].sort((a, b) => a.timestamp - b.timestamp);
  
  // Update current time when video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);
  
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };
  
  const jumpToKeyframe = (timestamp: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = timestamp;
    setCurrentTime(timestamp);
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const handleExport = () => {
    if (onExport) {
      onExport({
        resolution: exportResolution,
        format: exportFormat
      });
    }
  };
  
  const getCurrentKeyframe = () => {
    if (sortedKeyframes.length === 0) return null;
    
    // Find the keyframe that's closest to but not exceeding the current time
    let currentKeyframe = sortedKeyframes[0];
    
    for (const keyframe of sortedKeyframes) {
      if (keyframe.timestamp <= currentTime) {
        currentKeyframe = keyframe;
      } else {
        break;
      }
    }
    
    return currentKeyframe;
  };
  
  const currentKeyframe = getCurrentKeyframe();
  
  return (
    <div className="flex flex-col">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          controls={false}
          playsInline
        />
        
        {/* Video controls overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-16 h-16 flex items-center justify-center transition-all"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Video timeline control */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <div className="relative">
          {/* Timeline bar */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(to right, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
          
          {/* Keyframe markers */}
          {sortedKeyframes.map((keyframe, index) => (
            <div
              key={index}
              onClick={() => jumpToKeyframe(keyframe.timestamp)}
              className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-pointer hover:scale-125 transition-transform"
              style={{
                top: "50%",
                left: `${(keyframe.timestamp / (duration || 1)) * 100}%`,
                zIndex: 10
              }}
              title={`Scene ${index + 1}: ${keyframe.description || ""}`}
            />
          ))}
        </div>
      </div>
      
      {/* Current keyframe preview and controls */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current keyframe preview */}
        {currentKeyframe && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-md font-semibold mb-2">Current Keyframe</h3>
            <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded overflow-hidden mb-2">
              <img 
                src={currentKeyframe.imageUrl} 
                alt="Current keyframe" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentKeyframe.description || "No description available"}
            </p>
            {onEditScene && (
              <button
                onClick={() => onEditScene(currentKeyframe.timestamp)}
                className="mt-2 text-sm text-blue-500 hover:text-blue-700"
              >
                Edit This Scene
              </button>
            )}
          </div>
        )}
        
        {/* Scene navigation */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-2">Jump to Scene</h3>
          <div className="overflow-y-auto max-h-40">
            {sortedKeyframes.map((keyframe, index) => (
              <button
                key={index}
                onClick={() => jumpToKeyframe(keyframe.timestamp)}
                className={`w-full text-left p-2 text-sm rounded mb-1 ${
                  Math.abs(currentTime - keyframe.timestamp) < 0.5
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                }`}
              >
                Scene {index + 1} ({formatTime(keyframe.timestamp)})
              </button>
            ))}
          </div>
        </div>
        
        {/* Export options */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-2">Export Video</h3>
          <div>
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mb-2"
            >
              {showExportOptions ? "Hide Options" : "Export Options"}
            </button>
            
            {showExportOptions && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "mp4" | "webm" | "gif")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Resolution</label>
                  <select
                    value={exportResolution}
                    onChange={(e) => setExportResolution(e.target.value as "720p" | "1080p" | "480p")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                
                <button
                  onClick={handleExport}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Export
                </button>
                
                <a
                  href={videoUrl}
                  download="storyboard-video"
                  className="block w-full text-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md"
                >
                  Download Original
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 