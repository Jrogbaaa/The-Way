"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function QuickVideoTestPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      setStatus("Generating storyboard frames...");
      setVideoUrl(null);
      setGeneratedImages([]);
      
      // Step 1: Expand the prompt into keyframe prompts
      const expandResponse = await fetch("/api/video-generator/expand-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration: 30 })
      });
      
      if (!expandResponse.ok) throw new Error("Failed to expand prompt");
      const { keyframePrompts } = await expandResponse.json();
      
      // Step 2: Generate storyboard frames from the keyframe prompts
      setStatus("Generating images from prompts...");
      const storyboardResponse = await fetch("/api/video-generator/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyframePrompts })
      });
      
      if (!storyboardResponse.ok) throw new Error("Failed to generate storyboard");
      const { frames } = await storyboardResponse.json();
      
      // Display the generated images
      const imageUrls = frames.map((frame: any) => frame.imageUrl);
      setGeneratedImages(imageUrls);
      
      // Step 3: Generate video from the frames
      setStatus("Generating video from frames...");
      const videoResponse = await fetch("/api/video-generator/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          frames,
          options: {
            fps: 30,
            duration: 30,
            motionStrength: 0.7
          }
        })
      });
      
      if (!videoResponse.ok) throw new Error("Failed to generate video");
      const videoData = await videoResponse.json();
      
      setVideoUrl(videoData.videoUrl);
      setStatus("Video generation complete!");
    } catch (error) {
      console.error("Error generating video:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : "Failed to generate video"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">Quick Video Test</h1>
        <p className="text-gray-500">Enter a prompt to generate a 30-second AI video</p>
      </div>
      
      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <Textarea
            placeholder="Describe your 30-second video (e.g., 'A person walking down a street in a red shirt, then entering a cafe and ordering coffee')"
            value={prompt}
            onChange={handlePromptChange}
            className="min-h-[120px]"
            disabled={loading}
          />
          
          <Button 
            onClick={generateVideo} 
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Video"}
          </Button>
        </div>
      </Card>
      
      {status && (
        <div className="text-center">
          <p className="text-sm font-medium">Status: {status}</p>
        </div>
      )}
      
      {generatedImages.length > 0 && (
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Generated Frames</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {generatedImages.map((imgUrl, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                <img 
                  src={imgUrl} 
                  alt={`Frame ${index + 1}`} 
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-xs">
                  Frame {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {videoUrl && (
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Generated Video</h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden border">
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
} 