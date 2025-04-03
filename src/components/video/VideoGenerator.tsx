import React, { useState, useCallback, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

export default function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError("");
    }
  };

  const generateVideo = useCallback(async () => {
    if (!selectedImage) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      
      // Create a promise to handle the async file reading
      const fileToBase64 = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });
      
      const base64Image = await fileToBase64;
      
      // Call the API with the base64 image
      const response = await fetch("/api/video/huggingface-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: base64Image,
          prompt: prompt || undefined,
          num_frames: 25,
          fps: 7,
          motion_bucket_id: 127
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video");
      }

      setVideoUrl(data.videoUrl);
      if (onVideoGenerated) {
        onVideoGenerated(data.videoUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedImage, prompt, onVideoGenerated]);

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">AI Video Creator</h2>
      
      <div className="space-y-4">
        {/* Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Label 
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-40 mb-2 rounded-md" 
              />
            ) : (
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
            )}
            <span className="text-sm font-medium">
              {previewUrl ? "Change Image" : "Upload your image here"}
            </span>
          </Label>
        </div>

        {/* Optional Prompt */}
        <div>
          <Label htmlFor="prompt" className="text-sm font-medium mb-1 block">
            Prompt (Optional)
          </Label>
          <Input
            id="prompt"
            placeholder="Describe the desired motion (e.g., 'zoom in slowly', 'pan left to right')"
            value={prompt}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Create Video Button */}
        <Button 
          onClick={generateVideo} 
          disabled={loading || !selectedImage}
          className="w-full py-2"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Video...
            </>
          ) : (
            "Create Video"
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Generated Video */}
        {videoUrl && (
          <div className="mt-4">
            <video 
              src={videoUrl} 
              controls 
              className="w-full rounded-md border"
              autoPlay
              loop
            />
          </div>
        )}
      </div>
    </div>
  );
} 