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
      setStatus("Preparing to generate video...");
      setVideoUrl(null);
      setGeneratedImages([]);
      
      // For demonstration purposes, after a delay, we'll just show a message
      setTimeout(() => {
        setStatus("Video generation feature is coming soon!");
        setLoading(false);
      }, 2000);
      
      // The actual implementation would call API endpoints for video generation
    } catch (error) {
      console.error("Error:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : "Something went wrong"}`);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
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
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
} 