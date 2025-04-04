"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoGeneratorForm from "@/components/video-generator/VideoGeneratorForm";
import StoryboardPreview from "@/components/video-generator/StoryboardPreview";
import VideoPlayer from "@/components/video-generator/VideoPlayer";
import { StoryboardFrame, GeneratedVideo, KeyframePrompt } from "@/types/video-generator";

export default function VideoGeneratorPage() {
  const [activeTab, setActiveTab] = useState("concept");
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyframePrompts, setKeyframePrompts] = useState<KeyframePrompt[]>([]);
  const [storyboardFrames, setStoryboardFrames] = useState<StoryboardFrame[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);

  // Handle concept form submission
  const handleConceptSubmit = async (data: {
    prompt: string;
    style: string;
    duration: number;
    characterReference?: string;
  }) => {
    try {
      setIsProcessing(true);
      
      // Call API to expand prompt into keyframe prompts
      const expandResponse = await fetch("/api/video-generator/expand-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!expandResponse.ok) {
        throw new Error("Failed to expand prompt");
      }
      
      const expandData = await expandResponse.json();
      setKeyframePrompts(expandData.keyframePrompts);
      
      // Generate storyboard frames from keyframe prompts
      const storyboardResponse = await fetch("/api/video-generator/generate-storyboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyframePrompts: expandData.keyframePrompts,
          characterReference: data.characterReference
            ? { description: data.characterReference }
            : undefined,
        }),
      });
      
      if (!storyboardResponse.ok) {
        throw new Error("Failed to generate storyboard");
      }
      
      const storyboardData = await storyboardResponse.json();
      
      // Convert frames to storyboard format
      const frames = storyboardData.frames.map((frame: any) => ({
        ...frame,
        approved: false,
      }));
      
      setStoryboardFrames(frames);
      setActiveTab("storyboard");
    } catch (error) {
      console.error("Error generating storyboard:", error);
      alert("An error occurred while generating the storyboard.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle frame approval
  const handleApproveFrame = (frameId: string) => {
    setStoryboardFrames((prevFrames) =>
      prevFrames.map((frame) =>
        frame.id === frameId
          ? { ...frame, approved: !frame.approved }
          : frame
      )
    );
  };

  // Handle frame regeneration
  const handleRegenerateFrame = async (frameId: string) => {
    try {
      setIsProcessing(true);
      
      const frameToRegenerate = storyboardFrames.find((frame) => frame.id === frameId);
      
      if (!frameToRegenerate) {
        throw new Error("Frame not found");
      }
      
      // Call API to regenerate a specific frame
      // In a real implementation, this would call a specific endpoint for single frame regeneration
      // For now, we'll simulate it with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update the frame with a slightly modified URL to simulate regeneration
      setStoryboardFrames((prevFrames) =>
        prevFrames.map((frame) =>
          frame.id === frameId
            ? {
                ...frame,
                imageUrl: `${frame.imageUrl}?v=${Date.now()}`,
                metadata: {
                  ...frame.metadata,
                  regeneratedAt: new Date().toISOString(),
                },
              }
            : frame
        )
      );
    } catch (error) {
      console.error("Error regenerating frame:", error);
      alert("An error occurred while regenerating the frame.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle approving all frames
  const handleApproveAllFrames = () => {
    setStoryboardFrames((prevFrames) =>
      prevFrames.map((frame) => ({ ...frame, approved: true }))
    );
  };

  // Handle generating final video
  const handleGenerateVideo = async () => {
    try {
      setIsProcessing(true);
      
      // Check if all frames are approved
      const allApproved = storyboardFrames.every((frame) => frame.approved);
      
      if (!allApproved) {
        alert("Please approve all frames before generating the video.");
        return;
      }
      
      // Call API to generate video from approved frames
      const videoResponse = await fetch("/api/video-generator/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frames: storyboardFrames,
          options: {
            fps: 30,
            duration: 30,
            resolution: "1080p",
            motionStrength: 0.7,
          },
        }),
      });
      
      if (!videoResponse.ok) {
        throw new Error("Failed to generate video");
      }
      
      const videoData = await videoResponse.json();
      setGeneratedVideo(videoData);
      setActiveTab("video");
    } catch (error) {
      console.error("Error generating video:", error);
      alert("An error occurred while generating the video.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle video download
  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    
    // In a real implementation, this would trigger a download of the video
    window.open(generatedVideo.videoUrl, "_blank");
  };

  // Handle video share
  const handleShareVideo = () => {
    if (!generatedVideo) return;
    
    // In a real implementation, this would open a share dialog
    navigator.clipboard.writeText(generatedVideo.videoUrl);
    alert("Video URL copied to clipboard");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">30-Second AI Video Generator</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="concept">1. Video Concept</TabsTrigger>
          <TabsTrigger 
            value="storyboard"
            disabled={storyboardFrames.length === 0}
          >
            2. Storyboard
          </TabsTrigger>
          <TabsTrigger 
            value="video"
            disabled={!generatedVideo}
          >
            3. Final Video
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="concept" className="mt-6">
          <VideoGeneratorForm
            onSubmit={handleConceptSubmit}
            isProcessing={isProcessing}
          />
        </TabsContent>
        
        <TabsContent value="storyboard" className="mt-6">
          <div className="space-y-6">
            <StoryboardPreview
              frames={storyboardFrames}
              onApprove={handleApproveFrame}
              onRegenerate={handleRegenerateFrame}
              onApproveAll={handleApproveAllFrames}
              isLoading={isProcessing}
            />
            
            <div className="flex justify-center">
              <button
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateVideo}
                disabled={
                  isProcessing ||
                  storyboardFrames.length === 0 ||
                  !storyboardFrames.every((frame) => frame.approved)
                }
              >
                {isProcessing ? "Generating..." : "Generate Video"}
              </button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="video" className="mt-6">
          {generatedVideo && (
            <VideoPlayer
              videoUrl={generatedVideo.videoUrl}
              thumbnailUrl={generatedVideo.thumbnailUrl}
              keyframes={storyboardFrames}
              duration={generatedVideo.metadata.duration}
              onDownload={handleDownloadVideo}
              onShare={handleShareVideo}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 