"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Slider } from "../ui/slider";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Download, Share, Maximize, Minimize, RefreshCw 
} from "lucide-react";
import { StoryboardFrame } from "@/src/types/video-generator";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  keyframes?: StoryboardFrame[];
  duration?: number;
  onDownload?: () => void;
  onShare?: () => void;
  onRegenerate?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  keyframes = [],
  duration = 30,
  onDownload,
  onShare,
  onRegenerate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isPlaying, showControls]);
  
  // Update current time as video plays
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const updateTime = () => {
      setCurrentTime(video.currentTime);
    };
    
    video.addEventListener("timeupdate", updateTime);
    
    return () => {
      video.removeEventListener("timeupdate", updateTime);
    };
  }, []);
  
  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    
    setIsMuted(newVolume === 0);
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      video.volume = 0;
      setVolume(0);
    } else {
      video.volume = 1;
      setVolume(1);
    }
  };
  
  // Handle seeking
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = document.getElementById("video-container");
    
    if (!videoContainer) return;
    
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generated Video</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          id="video-container" 
          className="relative aspect-video bg-black"
          onMouseMove={() => setShowControls(true)}
        >
          {!isLoaded && thumbnailUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={thumbnailUrl}
                alt="Video thumbnail"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full h-16 w-16"
                  onClick={togglePlay}
                >
                  <Play className="h-8 w-8" />
                </Button>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedData={() => setIsLoaded(true)}
            onClick={togglePlay}
          />
          
          {/* Video Controls */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
              showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white">
                {formatTime(currentTime)}
              </span>
              
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              
              <span className="text-xs text-white">
                {formatTime(duration)}
              </span>
            </div>
            
            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="w-24 hidden sm:block">
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                )}
                
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={onDownload}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                )}
                
                {onShare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={onShare}
                  >
                    <Share className="h-5 w-5" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Keyframes navigation */}
        {keyframes.length > 0 && (
          <div className="p-4 border-t">
            <h3 className="text-sm font-medium mb-2">Keyframes</h3>
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {keyframes.map((frame) => (
                <div
                  key={frame.id}
                  className="relative flex-shrink-0 w-24 cursor-pointer"
                  onClick={() => {
                    // Calculate approximate time position for this keyframe
                    if (!videoRef.current) return;
                    
                    const frameIndex = keyframes.findIndex((f) => f.id === frame.id);
                    const totalFrames = keyframes.length;
                    const position = (frameIndex / (totalFrames - 1)) * duration;
                    
                    videoRef.current.currentTime = position;
                    setCurrentTime(position);
                  }}
                >
                  <div className="relative aspect-video mb-1 rounded-sm overflow-hidden">
                    <Image
                      src={frame.imageUrl}
                      alt={`Scene ${frame.scene}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 100px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs text-center block truncate">
                    Scene {frame.scene}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          Generated 30-second video from your concept
        </div>
      </CardFooter>
    </Card>
  );
} 