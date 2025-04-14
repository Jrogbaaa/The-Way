"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Scene } from "@/lib/narrative-parser";
import { Info, ArrowRight, Loader2, CheckCircle, Download } from "lucide-react";

type GeneratedFrame = {
  id: string;
  sequence: number;
  description: string;
  imagePrompt: string;
  videoPrompt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  predictionId?: string;
  status: string;
  processingProgress?: number;
};

export default function LongformVideoPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [frames, setFrames] = useState<GeneratedFrame[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const [showGlobalProgress, setShowGlobalProgress] = useState<boolean>(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Add polling mechanism to check video generation status
  useEffect(() => {
    // Find frames with predictionIds that need checking
    const framesToCheck = frames.filter(f => f.predictionId && f.status.includes("progress"));
    
    if (framesToCheck.length === 0) return;
    
    let pollingCount = 0;
    // Set up polling interval
    const intervalId = setInterval(async () => {
      pollingCount++;
      let allCompleted = true;
      
      for (const frame of framesToCheck) {
        if (frame.predictionId) {
          try {
            console.log(`Polling for prediction ID ${frame.predictionId} (attempt ${pollingCount})`);
            
            // Check if this is a placeholder ID (starts with 'placeholder-')
            if (frame.predictionId?.startsWith('placeholder-')) {
              console.log('This is a placeholder ID - simulating progress');
              
              // Simulate progress for placeholders
              const progress = Math.min(pollingCount * 15, 100); // Faster progress for placeholders
              
              if (progress === 100) {
                // At 100%, mark as succeeded
                setFrames(prevFrames => 
                  prevFrames.map(f => 
                    f.predictionId === frame.predictionId 
                      ? { 
                          ...f, 
                          // Keep the existing video URL (placeholder gif)
                          status: "Video generated successfully (placeholder)",
                          processingProgress: 100 
                        }
                      : f
                  )
                );
                
                setStatus("Placeholder video generation complete!");
                allCompleted = true;
              } else {
                // Update progress
                setFrames(prevFrames => 
                  prevFrames.map(f => 
                    f.predictionId === frame.predictionId 
                      ? { 
                          ...f, 
                          status: `Placeholder video generation (${progress}%)`,
                          processingProgress: progress
                        }
                      : f
                  )
                );
                
                setStatus(`Placeholder video generation in progress (${progress}%)`);
                allCompleted = false;
              }
              
              continue; // Skip the API call for placeholders
            }
            
            const response = await fetch(`http://localhost:3000/api/video/image-to-video/status?id=${frame.predictionId}`);
            const data = await response.json();
            
            console.log(`Received status for ${frame.predictionId}:`, data);
            
            // Update progress indicator based on polling count
            const progress = Math.min(pollingCount * 5, 90); // Cap at 90% until complete
            
            if (data.status === 'succeeded' && data.output) {
              // Get the video URL - prefer the cached version if available
              const videoUrl = data.cachedVideoUrl || data.output;
              
              // Video completed successfully - update with real URL
              console.log(`Video generation succeeded for ${frame.predictionId}, output URL:`, videoUrl);
              setFrames(prevFrames => 
                prevFrames.map(f => 
                  f.predictionId === frame.predictionId 
                    ? { 
                        ...f, 
                        videoUrl: videoUrl, 
                        status: "Video generated successfully", 
                        processingProgress: 100 
                      }
                    : f
                )
              );
              
              setStatus("Video generation complete!");
              
              // Store final video URL
              setFinalVideoUrl(videoUrl);
              allCompleted = true;
            } else if (data.status === 'failed') {
              // Generation failed with error
              console.log(`Video generation failed for ${frame.predictionId}, error:`, data.error);
              setFrames(prevFrames => 
                prevFrames.map(f => 
                  f.predictionId === frame.predictionId 
                    ? { 
                        ...f, 
                        status: `Error: ${data.error || 'Video generation failed'}`,
                        processingProgress: 100 
                      }
                    : f
                )
              );
              
              setStatus(`Error: ${data.error || 'Video generation failed'}`);
              allCompleted = true;
            } else {
              // Still processing - update progress
              console.log(`Video generation still in progress for ${frame.predictionId}, status:`, data.status);
              setFrames(prevFrames => 
                prevFrames.map(f => 
                  f.predictionId === frame.predictionId 
                    ? { 
                        ...f, 
                        status: `Video generation in progress (${progress}%)`,
                        processingProgress: progress
                      }
                    : f
                )
              );
              
              setStatus(`Video generation in progress (${progress}%) - typically takes 2-3 minutes...`);
              allCompleted = false;
            }
          } catch (error) {
            console.error(`Error checking video status for ${frame.predictionId}:`, error);
            allCompleted = false;
          }
        }
      }
      
      if (allCompleted || pollingCount > 30) { // Maximum 5 minutes (30 * 10 seconds)
        console.log(`Polling complete after ${pollingCount} attempts. All completed: ${allCompleted}`);
        clearInterval(intervalId);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(intervalId);
    };
  }, [frames]);

  // Add an effect to automatically poll for video status
  useEffect(() => {
    // Clean up any existing polling interval when component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Function to format time remaining in a human-readable format
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Any moment now...";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };
  
  // Function to start a countdown timer
  const startCountdownTimer = useCallback((initialSeconds: number) => {
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    setEstimatedTimeRemaining(initialSeconds);
    
    const interval = setInterval(() => {
      setEstimatedTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  }, [timerInterval]);

  // Function to clear the countdown timer
  const clearCountdownTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setEstimatedTimeRemaining(null);
  }, [timerInterval]);
  
  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Function to start polling for a prediction
  const startPollingPrediction = useCallback((predictionId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Show the global progress bar
    setShowGlobalProgress(true);
    setGlobalProgress(10); // Start at 10%
    
    // Start countdown timer (120 seconds = 2 minutes)
    startCountdownTimer(120);
    
    console.log(`Starting automatic polling for prediction: ${predictionId}`);
    setStatus("Video generation in progress - checking status automatically every 15 seconds");
    
    // Set up polling every 15 seconds
    const interval = setInterval(async () => {
      try {
        console.log(`Automatically checking status for prediction: ${predictionId}`);
        
        // Increment global progress slightly each time we check
        setGlobalProgress(prev => Math.min(prev + 5, 95)); // Increment but cap at 95% until complete
        
        const response = await fetch(`${window.location.origin}/api/video/image-to-video/status?id=${predictionId}`);
        
        if (!response.ok) {
          console.error(`Status check failed: ${response.status} ${response.statusText}`);
          
          // If 404, stop polling - prediction not found
          if (response.status === 404) {
            clearInterval(interval);
            setPollingInterval(null);
            setStatus("Error: Prediction not found. It may have expired or been deleted.");
          }
          return;
        }
        
        const data = await response.json();
        console.log(`Automatic status check: ${data.status}`);
        
        // Update frames with the latest status
        setFrames(prevFrames => 
          prevFrames.map(f => 
            f.predictionId === predictionId 
              ? { 
                  ...f, 
                  status: `Video processing: ${data.status}`,
                  processingProgress: data.status === 'succeeded' ? 100 : 
                                      data.status === 'failed' ? 100 : 
                                      data.status === 'processing' ? 70 : 50
                }
              : f
          )
        );
        
        // If the prediction has completed (succeeded or failed), update UI and stop polling
        if (data.status === 'succeeded' && data.output) {
          // Get the best video URL (data URL, cached URL, or original)
          const bestVideoUrl = 
            // Prefer data URL (most reliable)
            (typeof data.output === 'string' && data.output.startsWith('data:video/')) ? data.output :
            // Next prefer cached URL (server-side cached)
            data.cachedVideoUrl ? `${window.location.origin}${data.cachedVideoUrl}` :
            // Fallback to original URL (may expire)
            data.output;
          
          // Update the frame with the video URL
          setFrames(prevFrames => 
            prevFrames.map(f => 
              f.predictionId === predictionId 
                ? { 
                    ...f, 
                    videoUrl: bestVideoUrl,
                    status: "Video generated successfully", 
                    processingProgress: 100 
                  }
                : f
            )
          );
          
          // Set the final video URL
          setFinalVideoUrl(bestVideoUrl);
          setStatus("Video generated successfully!");
          
          // Complete the progress bar and hide it after a delay
          setGlobalProgress(100);
          setTimeout(() => {
            setShowGlobalProgress(false);
          }, 1500);
          
          // Clear the countdown timer
          clearCountdownTimer();
          
          // Stop polling
          clearInterval(interval);
          setPollingInterval(null);
        } else if (data.status === 'failed') {
          // If generation failed, update status and stop polling
          setStatus(`Error: ${data.error || 'Video generation failed'}`);
          
          // Update frame status
          setFrames(prevFrames => 
            prevFrames.map(f => 
              f.predictionId === predictionId 
                ? { 
                    ...f, 
                    status: `Error: ${data.error || 'Video generation failed'}`,
                    processingProgress: 100 
                  }
                : f
            )
          );
          
          // Hide the progress bar after failure
          setGlobalProgress(100);
          setTimeout(() => {
            setShowGlobalProgress(false);
          }, 1500);
          
          // Clear the countdown timer
          clearCountdownTimer();
          
          // Stop polling
          clearInterval(interval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error("Automatic status check error:", error);
      }
    }, 15000); // Check every 15 seconds
    
    setPollingInterval(interval);
  }, [pollingInterval, startCountdownTimer, clearCountdownTimer]);

  // Call the API to generate scene data from the main prompt
  const getScenes = async (mainPrompt: string): Promise<Scene[]> => {
    const response = await fetch('/api/quick-video-test/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: mainPrompt })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate scene data');
    }
    
    const data = await response.json();
    return data.scenes;
  };

  // Call the API to generate an image from a prompt
  const generateImage = async (imagePrompt: string): Promise<string> => {
    const response = await fetch('/api/quick-video-test/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imagePrompt })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  };

  // Call the API to generate a video from an image and prompt
  // This uses the Hugging Face stabilityai/stable-video-diffusion-img2vid-xt model under the hood
  const generateVideoFromImage = async (imageUrl: string, videoPrompt: string): Promise<{
    videoUrl: string;
    predictionId?: string;
    status?: string;
    message?: string;
  }> => {
    const response = await fetch('/api/quick-video-test/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl,
        prompt: videoPrompt
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate video');
    }
    
    const data = await response.json();
    return {
      videoUrl: data.videoUrl,
      predictionId: data.predictionId,
      status: data.status,
      message: data.message
    };
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      setStatus("Analyzing your narrative...");
      setFrames([]);
      setFinalVideoUrl(null);
      
      // Show global progress bar and set initial value
      setShowGlobalProgress(true);
      setGlobalProgress(5);
      
      // Step 1: Generate scene data from the main prompt
      setStatus("Step 1: Analyzing your narrative and creating scenes...");
      const scenes = await getScenes(prompt);
      console.log("Generated scenes:", scenes);
      
      // Update progress
      setGlobalProgress(15);
      
      // For longform videos, we'll process more than just the first scene
      // Let's process up to 3 scenes for now to demonstrate the longform capability
      const scenesToProcess = scenes.slice(0, Math.min(3, scenes.length));
      
      // Create initial frame objects for all scenes we'll process
      const initialFrames = scenesToProcess.map(scene => ({
        id: scene.id,
        sequence: scene.sequence,
        description: scene.description,
        imagePrompt: scene.imagePrompt,
        videoPrompt: scene.videoPrompt,
        imageUrl: null,
        videoUrl: null,
        status: "Step 1: Breaking down narrative into scenes...",
        processingProgress: 10
      }));
      
      setFrames(initialFrames);
      setGlobalProgress(20);
      
      // Step 2: Process each scene sequentially
      // For now, we'll just process the first scene as before to avoid making too many API calls
      // In a full implementation, we would process all scenes and then combine the videos
      const firstScene = initialFrames[0];
      
      // Update status to show we're generating the image for the first scene
      setFrames(prevFrames => 
        prevFrames.map(frame => 
          frame.id === firstScene.id 
            ? {
                ...frame,
                status: "Step 2: Generating image from prompt...",
                processingProgress: 30
              }
            : frame
        )
      );
      
      // Generate image for the first scene
      setStatus("Step 2: Generating image from prompt...");
      setGlobalProgress(25);
      
      try {
        // Generate image
        const imageUrl = await generateImage(firstScene.imagePrompt);
        console.log("Generated image URL:", imageUrl);
        
        // Update progress after image generation
        setGlobalProgress(40);
        
        // Update frame with image URL
        setFrames(prevFrames => 
          prevFrames.map(frame => 
            frame.id === firstScene.id 
              ? {
                  ...frame,
                  imageUrl,
                  status: "Step 3: Starting video generation from image...",
                  processingProgress: 50
                }
              : frame
          )
        );
        
        setStatus("Step 3: Starting video generation from image...");
        
        // Step 3: Generate video from the image
        try {
          setGlobalProgress(50);
          
          // Generate video from image
          setStatus("Step 3: Sending image to AI for video generation...");
          const videoResult = await generateVideoFromImage(
            imageUrl, 
            firstScene.videoPrompt
          );
          
          // Don't log the full URL as it can be very long for data URLs
          console.log("Video generation result:", 
            videoResult.predictionId 
              ? `Prediction ID: ${videoResult.predictionId}` 
              : "Direct video received");
          
          // Update progress based on whether we got a direct video or need to poll
          if (videoResult.predictionId) {
            setGlobalProgress(60); // If we need to poll, we're about 60% done
          } else {
            setGlobalProgress(95); // If we got direct video, almost done
          }
          
          const statusMessage = videoResult.predictionId 
            ? "Step 3: Video generation started - estimated time: 2-3 minutes" 
            : "Process complete: Video generated successfully";
          
          const progress = videoResult.predictionId ? 60 : 100;
          
          // Update frame with video URL and prediction ID if available
          setFrames(prevFrames => 
            prevFrames.map(frame => 
              frame.id === firstScene.id 
                ? {
                    ...frame,
                    videoUrl: videoResult.videoUrl,
                    predictionId: videoResult.predictionId,
                    status: statusMessage,
                    processingProgress: progress
                  }
                : frame
            )
          );
          
          // Set the final video URL - this will be displayed later
          if (videoResult.videoUrl && !videoResult.predictionId) {
            // Direct video URL received (not just a prediction ID)
            setFinalVideoUrl(videoResult.videoUrl);
            setStatus("Video generated successfully!");
            
            // Complete the progress bar and hide it after a delay
            setGlobalProgress(100);
            setTimeout(() => {
              setShowGlobalProgress(false);
            }, 1500);
          } else {
            // Just a prediction ID, set status message
            setFinalVideoUrl(null);
            setStatus(statusMessage);
          }
          
          // If we received a prediction ID, start polling for status
          if (videoResult.predictionId) {
            startPollingPrediction(videoResult.predictionId);
          }
          
          // Output helpful prediction ID info for debugging
          if (videoResult.predictionId) {
            console.log(`Prediction started with ID: ${videoResult.predictionId}`);
            console.log(`Check status manually at: ${window.location.origin}/api/video/image-to-video/status?id=${videoResult.predictionId}`);
          }
        } catch (error) {
          console.error("Video generation error:", error);
          setStatus("Error in Step 3: Failed to generate video. Please try again.");
          setShowGlobalProgress(false);
        }
      } catch (error) {
        console.error("Image generation error:", error);
        setStatus("Error in Step 2: Failed to generate image. Please try again.");
        setShowGlobalProgress(false);
      }
    } catch (error) {
      console.error("Scene processing error:", error);
      setStatus(`Error in Step 1: ${error instanceof Error ? error.message : "Something went wrong"}`);
      setShowGlobalProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 relative">
      {/* Global Progress Bar - Fixed at the top of the page */}
      {showGlobalProgress && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-700">Generating Video</h3>
              <span className="text-sm text-gray-500">{globalProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">{status}</p>
              {estimatedTimeRemaining !== null && (
                <p className="text-xs font-medium text-blue-600 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Est. time remaining: {formatTimeRemaining(estimatedTimeRemaining)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Longform Video Creator</h1>
          <p className="text-gray-500">Generate high-quality longform videos from text descriptions with AI narration</p>
        </div>
        
        {/* Model information */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-1">Powered by Hugging Face AI</h3>
          <p className="text-sm text-blue-700">
            This feature uses the <code className="px-1 py-0.5 bg-blue-100 rounded">stabilityai/stable-video-diffusion-img2vid-xt</code> model 
            from Hugging Face for high-quality video generation. The process converts your text into a scene, 
            generates an image, and then animates it into a fluid video.
          </p>
        </div>
        
        {/* Notice about placeholder mode */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-1">Test Mode Active</h3>
          <p className="text-sm text-yellow-700">
            The app is currently running in placeholder mode due to API configuration issues. 
            Images and videos are placeholders rather than AI-generated content.
            In production, this would connect to the Replicate API to generate real images and videos.
          </p>
        </div>
        
        <Card className="p-4">
          <div className="flex flex-col space-y-4">
            <Textarea
              placeholder="Describe your longform video content (e.g., 'A comprehensive tutorial about how to create delicious artisan bread, showing all the steps from kneading to baking')"
              value={prompt}
              onChange={handlePromptChange}
              className="min-h-[120px]"
              disabled={loading}
              id="scene-prompt"
              name="scene-prompt"
            />
            
            <Button 
              onClick={generateVideo} 
              disabled={loading || !prompt.trim()}
              className="w-full"
              id="generate-video-btn"
              name="generate-video-btn"
            >
              {loading ? "Processing..." : "Generate Longform Video"}
            </Button>
          </div>
        </Card>
        
        {status && (
          <div className="text-center mt-4 mb-2">
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}
        
        {frames.length > 0 && frames.some(f => f.predictionId && !f.status.includes("successfully")) && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Active Video Generations</h3>
            <div className="space-y-2">
              {frames.filter(f => f.predictionId && !f.status.includes("successfully")).map(frame => (
                <div key={`status-${frame.id}`} className="p-2 bg-white rounded border border-blue-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700">Scene {frame.sequence}: {frame.processingProgress || 0}% complete</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {frame.predictionId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center"
                      onClick={() => {
                        navigator.clipboard.writeText(frame.predictionId || '');
                        alert('Prediction ID copied to clipboard!');
                      }}
                      id={`copy-id-btn-${frame.id}`}
                      name={`copy-id-btn-${frame.id}`}
                    >
                      Copy ID
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center"
                      onClick={async () => {
                        if (!frame.predictionId) return;
                        
                        // Set status to checking
                        setStatus(`Checking status for prediction ${frame.predictionId}...`);
                        
                        // Handle placeholder IDs differently
                        if (frame.predictionId.startsWith('placeholder-')) {
                          alert('This is a placeholder prediction ID for testing purposes.\nNo actual API call is made for placeholders.');
                          setStatus('This is a placeholder prediction - no real status to check');
                          return;
                        }
                        
                        try {
                          // Use a timeout to prevent stuck requests
                          const controller = new AbortController();
                          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout
                          
                          const response = await fetch(`${window.location.origin}/api/video/image-to-video/status?id=${frame.predictionId}`, {
                            signal: controller.signal
                          });
                          
                          clearTimeout(timeoutId);
                          
                          if (!response.ok) {
                            if (response.status === 404) {
                              setStatus(`Error: Prediction not found. It may have expired or been deleted.`);
                              return;
                            }
                            throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
                          }
                          
                          const data = await response.json();
                          
                          // Show the full status information
                          setStatus(`Current status: ${data.status}`);
                          
                          // Update the UI with the latest status
                          if (data.status === 'succeeded' && data.output) {
                            // Video completed successfully - use best available URL option
                            const bestVideoUrl = 
                              // Prefer data URL (most reliable)
                              (typeof data.output === 'string' && data.output.startsWith('data:video/')) ? data.output :
                              // Next prefer cached URL (server-side cached)
                              data.cachedVideoUrl ? `${window.location.origin}${data.cachedVideoUrl}` :
                              // Fallback to original URL (may expire)
                              data.output;
                              
                            setFrames(prevFrames => 
                              prevFrames.map(f => 
                                f.predictionId === frame.predictionId 
                                  ? { 
                                      ...f, 
                                      videoUrl: bestVideoUrl, 
                                      status: "Video generated successfully", 
                                      processingProgress: 100 
                                    }
                                  : f
                              )
                            );
                            
                            setStatus("Video generation complete!");
                            setFinalVideoUrl(bestVideoUrl);
                          } else if (data.status === 'failed') {
                            // Generation failed with error
                            setFrames(prevFrames => 
                              prevFrames.map(f => 
                                f.predictionId === frame.predictionId 
                                  ? { 
                                      ...f, 
                                      status: `Error: ${data.error || 'Video generation failed'}`,
                                      processingProgress: 100 
                                    }
                                  : f
                              )
                            );
                            
                            setStatus(`Error: ${data.error || 'Video generation failed'}`);
                          } else {
                            // Still processing - update status
                            setStatus(`Status: ${data.status}. Processing - typically takes 2-3 minutes.`);
                          }
                        } catch (error) {
                          console.error("Manual status check error:", error);
                          
                          if (error instanceof Error) {
                            // Handle specific error types
                            if (error.name === 'AbortError') {
                              setStatus("Error: Request timed out. Please try again.");
                            } else if (error.message.includes('Failed to fetch')) {
                              setStatus("Network error: Unable to connect to the server. Please check your connection and try again.");
                            } else {
                              setStatus(`Error checking prediction status: ${error.message}`);
                            }
                          } else {
                            setStatus("Error checking prediction status");
                          }
                        }
                      }}
                      id={`check-status-btn-${frame.id}`}
                      name={`check-status-btn-${frame.id}`}
                    >
                      Check Now
                    </button>
                    <a
                      href={`https://replicate.com/p/${frame.predictionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center"
                    >
                      View on Replicate
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Video generation typically takes 2-3 minutes. You'll see the video once processing is complete.
              <br />The console errors about preloaded resources are normal and don't affect the generation process.
            </p>
          </div>
        )}
        
        {frames.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Generated Scene</h2>
            <div className="grid grid-cols-1 gap-4">
              {frames.map((frame) => (
                <Card key={frame.id} className="overflow-hidden">
                  <div className="p-3 border-b bg-gray-50">
                    <h3 className="font-medium text-sm">Scene {frame.sequence}</h3>
                    <p className="text-xs text-gray-500 mt-1">{frame.description}</p>
                  </div>
                  
                  <div className="p-3">
                    <div className="text-xs text-gray-400 mb-1">Image Prompt:</div>
                    <p className="text-xs text-gray-600 mb-3">{frame.imagePrompt}</p>
                    <div className="text-xs text-gray-400 mb-1">Video Prompt:</div>
                    <p className="text-xs text-gray-600 mb-3">{frame.videoPrompt}</p>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-32 h-8 rounded-full bg-gray-100 text-sm flex items-center justify-center">Step 1: Scene</div>
                      <ArrowRight className="mx-2 w-4 h-4 text-gray-400" />
                      <div className="w-32 h-8 rounded-full bg-gray-100 text-sm flex items-center justify-center">Step 2: Image</div>
                      <ArrowRight className="mx-2 w-4 h-4 text-gray-400" />
                      <div className="w-32 h-8 rounded-full bg-gray-100 text-sm flex items-center justify-center">Step 3: Video</div>
                    </div>
                    
                    {/* Progress Bar */}
                    {frame.processingProgress !== undefined && frame.processingProgress < 100 && (
                      <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                        <div 
                          className="h-2 bg-blue-500 rounded-full transition-all duration-500 ease-in-out" 
                          style={{ width: `${frame.processingProgress}%` }}
                        ></div>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <div className="text-sm font-medium mb-2">Generated Image</div>
                        <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-md">
                          {frame.imageUrl ? (
                            <img 
                              src={frame.imageUrl} 
                              alt={`Scene ${frame.sequence}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse w-8 h-8 rounded-full bg-gray-300"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-1/2">
                        <div className="text-sm font-medium mb-2 flex items-center">
                          Animated Video
                          {frame.predictionId && !frame.status.includes("successfully") && (
                            <div className="ml-2 flex items-center text-xs text-amber-600 font-normal">
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              Processing...
                            </div>
                          )}
                        </div>
                        <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-md">
                          {frame.videoUrl ? (
                            frame.status.includes("successfully") ? (
                              // Final video - real output from Replicate
                              <video 
                                src={frame.videoUrl} 
                                controls
                                loop
                                muted
                                autoPlay
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              // Placeholder GIF while waiting
                              <div className="relative w-full h-full">
                                <video 
                                  src={frame.videoUrl} 
                                  loop
                                  muted
                                  autoPlay
                                  className="w-full h-full object-contain opacity-70"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black/50 px-3 py-2 rounded-lg text-white text-sm flex items-center">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing video...
                                  </div>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse w-8 h-8 rounded-full bg-gray-300"></div>
                            </div>
                          )}
                        </div>
                        {frame.predictionId && !frame.status.includes("successfully") && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                            <p className="text-xs text-amber-700 flex items-start">
                              <Info className="h-3.5 w-3.5 mr-1 flex-shrink-0 mt-0.5" />
                              <span>
                                <span className="font-medium">Video generation in progress</span> ({frame.processingProgress || 0}%)
                                <br />
                                <span className="font-medium">Prediction ID:</span>
                                <code className="ml-1 px-1 py-0.5 bg-amber-100 rounded text-amber-800 break-all">{frame.predictionId}</code>
                                <button 
                                  className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-800 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(frame.predictionId || '');
                                    alert('Prediction ID copied to clipboard!');
                                  }}
                                  id={`copy-prediction-id-${frame.id}`}
                                  name={`copy-prediction-id-${frame.id}`}
                                >
                                  Copy
                                </button>
                                <br />
                                <div className="flex items-center mt-1 text-[10px] text-amber-600">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  <span>Auto-checking status every 15 seconds</span>
                                </div>
                                <button
                                  className="mt-1 px-1.5 py-0.5 text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-800 rounded flex items-center"
                                  onClick={async () => {
                                    if (!frame.predictionId) return;
                                    try {
                                      // Handle placeholder IDs differently
                                      if (frame.predictionId.startsWith('placeholder-')) {
                                        alert('This is a placeholder prediction ID for testing purposes.\nNo actual API call is made for placeholders.');
                                        return;
                                      }
                                      
                                      setStatus("Checking video status...");
                                      
                                      const response = await fetch(`${window.location.origin}/api/video/image-to-video/status?id=${frame.predictionId}`);
                                      
                                      if (!response.ok) {
                                        setStatus(`Error checking status: ${response.status} ${response.statusText}`);
                                        return;
                                      }
                                      
                                      const data = await response.json();
                                      
                                      // Instead of showing an alert, update the frame with the video
                                      if (data.status === 'succeeded' && data.output) {
                                        // Get the best video URL (data URL, cached URL, or original)
                                        const bestVideoUrl = 
                                          // Prefer data URL (most reliable)
                                          (typeof data.output === 'string' && data.output.startsWith('data:video/')) ? data.output :
                                          // Next prefer cached URL (server-side cached)
                                          data.cachedVideoUrl ? `${window.location.origin}${data.cachedVideoUrl}` :
                                          // Fallback to original URL (may expire)
                                          data.output;
                                        
                                        // Update the frame with the video URL
                                        setFrames(prevFrames => 
                                          prevFrames.map(f => 
                                            f.predictionId === frame.predictionId 
                                              ? { 
                                                  ...f, 
                                                  videoUrl: bestVideoUrl,
                                                  status: "Video generated successfully", 
                                                  processingProgress: 100 
                                                }
                                              : f
                                          )
                                        );
                                        
                                        setStatus("Video retrieved successfully!");
                                      } else {
                                        setStatus(`Current status: ${data.status || 'unknown'} - ${data.error || 'No errors'}`);
                                      }
                                    } catch (error) {
                                      console.error("Manual status check error:", error);
                                      setStatus("Error checking status");
                                    }
                                  }}
                                  id={`check-status-manual-${frame.id}`}
                                  name={`check-status-manual-${frame.id}`}
                                >
                                  Fetch Video
                                </button>
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border-t bg-gray-50">
                    <p className="text-sm text-center">{frame.status}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Final Generated Video Section */}
        {finalVideoUrl && (
          <div className="mt-8 p-6 border border-green-200 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" /> 
              Final Generated Video
            </h2>
            <p className="text-sm text-green-700 mb-4">
              Your video has been successfully generated! You can play it below or right-click to save it.
            </p>
            <div className="bg-black rounded-lg overflow-hidden shadow-lg max-w-2xl mx-auto">
              <video 
                src={finalVideoUrl} 
                controls
                loop
                autoPlay
                className="w-full"
                poster={frames[0]?.imageUrl || undefined}
              />
            </div>
            <div className="mt-4 text-center">
              <a 
                href={finalVideoUrl} 
                download="generated-video.mp4"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Video
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 