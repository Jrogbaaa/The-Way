"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

type GeneratedFrame = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  status: string;
};

export default function QuickVideoTestPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [frames, setFrames] = useState<GeneratedFrame[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Call the API to generate scene prompts from the main prompt
  const getScenePrompts = async (mainPrompt: string): Promise<string[]> => {
    const response = await fetch('/api/quick-video-test/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: mainPrompt })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate scene prompts');
    }
    
    const data = await response.json();
    return data.scenePrompts;
  };

  // Call the API to generate an image from a prompt
  const generateImage = async (scenePrompt: string): Promise<string> => {
    const response = await fetch('/api/quick-video-test/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: scenePrompt })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  };

  // Call the API to generate a video from an image and prompt
  const generateVideoFromImage = async (imageUrl: string, scenePrompt: string): Promise<string> => {
    const response = await fetch('/api/quick-video-test/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl,
        prompt: scenePrompt
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate video');
    }
    
    const data = await response.json();
    return data.videoUrl;
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      setStatus("Breaking down your prompt into scenes...");
      setFrames([]);
      setFinalVideoUrl(null);
      
      // Step 1: Generate scene prompts from the main prompt
      const scenePrompts = await getScenePrompts(prompt);
      
      // Create initial frame objects
      const initialFrames = scenePrompts.map((scenePrompt, index) => ({
        id: `frame-${index}`,
        prompt: scenePrompt,
        imageUrl: null,
        videoUrl: null,
        status: "Pending image generation"
      }));
      
      setFrames(initialFrames);
      
      // Step 2: Generate images for each frame
      setStatus("Generating images for each scene...");
      
      for (let i = 0; i < initialFrames.length; i++) {
        // Update status for this frame
        setFrames(prevFrames => 
          prevFrames.map((frame, idx) => 
            idx === i 
              ? { ...frame, status: "Generating image..." } 
              : frame
          )
        );
        
        // Generate image
        const imageUrl = await generateImage(scenePrompts[i]);
        
        // Update frame with image URL
        setFrames(prevFrames => 
          prevFrames.map((frame, idx) => 
            idx === i 
              ? { ...frame, imageUrl, status: "Image generated, preparing video..." } 
              : frame
          )
        );
      }
      
      // Step 3: Generate videos for each frame
      setStatus("Generating videos from images...");
      
      // Get the current frames with updated image URLs
      const currentFrames = [...frames];
      
      for (let i = 0; i < currentFrames.length; i++) {
        // Update status for this frame
        setFrames(prevFrames => 
          prevFrames.map((frame, idx) => 
            idx === i 
              ? { ...frame, status: "Generating video..." } 
              : frame
          )
        );
        
        const frame = currentFrames[i];
        if (frame?.imageUrl) {
          // Generate video from image
          const videoUrl = await generateVideoFromImage(
            frame.imageUrl, 
            frame.prompt
          );
          
          // Update frame with video URL
          setFrames(prevFrames => 
            prevFrames.map((f, idx) => 
              idx === i 
                ? { ...f, videoUrl, status: "Video generated" } 
                : f
            )
          );
        }
      }
      
      // Step 4: In a real implementation, you would combine all videos
      setStatus("All scenes processed successfully!");
      
      // For now, we'll just use the first video as a final result
      const firstFrameWithVideo = frames.find(frame => frame.videoUrl);
      if (firstFrameWithVideo?.videoUrl) {
        setFinalVideoUrl(firstFrameWithVideo.videoUrl);
      }
      
    } catch (error) {
      console.error("Error generating video:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Quick Video Test</h1>
          <p className="text-gray-500">Enter a prompt to generate a 30-second AI video from 6 scenes</p>
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
          <div className="text-center mt-4 mb-2">
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}
        
        {frames.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Generated Scenes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frames.map((frame, index) => (
                <Card key={frame.id} className="overflow-hidden">
                  <div className="p-3 border-b bg-gray-50">
                    <h3 className="font-medium text-sm">Scene {index + 1}</h3>
                    <p className="text-xs text-gray-500 mt-1">{frame.prompt}</p>
                  </div>
                  <div className="relative aspect-video bg-gray-100">
                    {frame.imageUrl ? (
                      <img 
                        src={frame.imageUrl} 
                        alt={`Scene ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-300"></div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs">
                      {frame.status}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {finalVideoUrl && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Final Video</h2>
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                {/* In a real implementation, this would be a video player */}
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={finalVideoUrl} 
                    alt="Generated video (placeholder)"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 