'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImageDisplay } from '@/components/ui/image-display';
import { runImageToVideoModel, checkVideoGenerationStatus } from '@/lib/api/replicate';
import { Loader2, Upload, Sparkles, AlertCircle, Sliders, RefreshCw, Film, Download, Check } from 'lucide-react';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';

interface ImageToVideoConverterProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

export default function ImageToVideoConverter({ onVideoGenerated }: ImageToVideoConverterProps) {
  // State for the input image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  // State for the generated video
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  
  // State for the form inputs
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [motionStrength, setMotionStrength] = useState(127);
  const [fps, setFps] = useState(8);
  const [numFrames, setNumFrames] = useState(81);
  const [guidanceScale, setGuidanceScale] = useState(9.0);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Use the progress hook for tracking generation progress
  const {
    progress,
    processingTimeMs,
    estimatedTotalTimeMs,
    startGeneration,
    completeGeneration,
    failGeneration,
    reset: resetProgress
  } = useGenerationProgress({ 
    modelName: 'Wan 2.1 I2V',
    estimatedTime: 20000 // Estimate 20 seconds for video generation
  });
  
  // Check the status of a running prediction
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (predictionId && !videoUrl && !error) {
      intervalId = setInterval(async () => {
        try {
          const status = await checkVideoGenerationStatus(predictionId);
          console.log('Checking prediction status:', status);
          
          if (status.status === 'succeeded') {
            clearInterval(intervalId);
            setVideoUrl(status.output);
            completeGeneration(status.output);
            setSuccessMessage('Video generated successfully!');
            
            if (onVideoGenerated) {
              onVideoGenerated(status.output);
            }
          } else if (status.status === 'failed') {
            clearInterval(intervalId);
            setError(status.error || 'Video generation failed');
            failGeneration(status.error || 'Video generation failed');
          }
        } catch (err) {
          console.error('Error checking prediction status:', err);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [predictionId, videoUrl, error, completeGeneration, failGeneration, onVideoGenerated]);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setImageFile(file);
    setVideoUrl(null);
    setError(null);
    setSuccessMessage(null);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle dropping files
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Reset states
    setImageFile(file);
    setVideoUrl(null);
    setError(null);
    setSuccessMessage(null);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageBase64) {
      setError('Please upload an image first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setPredictionId(null);
    resetProgress();
    
    try {
      // Generate a fake ID for progress tracking
      const fakeId = `i2v-${Date.now()}`;
      startGeneration(fakeId);
      
      const result = await runImageToVideoModel({
        image: imageBase64,
        prompt,
        negative_prompt: negativePrompt,
        motion_bucket_id: motionStrength,
        fps,
        num_frames: numFrames,
        guidance_scale: guidanceScale,
      });
      
      // If we got a prediction ID, store it for polling
      if (typeof result === 'object' && result.predictionId) {
        setPredictionId(result.predictionId);
      } 
      // If we got a direct video URL, use it
      else if (typeof result === 'string') {
        setVideoUrl(result);
        completeGeneration(result);
        setSuccessMessage('Video generated successfully!');
        
        if (onVideoGenerated) {
          onVideoGenerated(result);
        }
        
        // Scroll to result
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      failGeneration(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection click
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle downloading the video
  const handleDownloadVideo = async () => {
    if (!videoUrl) return;
    
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Use a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `generated-video-${timestamp}.mp4`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading video:', err);
      setError('Failed to download video');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Film className="w-5 h-5 mr-2 text-indigo-600" />
          Convert Image to Video
        </h3>
        
        <p className="text-gray-600 mb-5">
          Upload an image and convert it into a dynamic video using the Wan 2.1 model. Add optional text prompts to guide the generation.
        </p>
        
        {/* Image Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-5 ${
            imagePreview ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-indigo-300 bg-gray-50'
          } transition-colors`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {imagePreview ? (
            <div className="space-y-4">
              <div className="relative max-w-xs mx-auto">
                <img 
                  src={imagePreview} 
                  alt="Uploaded image" 
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm text-gray-600">{imageFile?.name}</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSelectFileClick}
              >
                Change Image
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600">Drag and drop an image here, or click to select</p>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSelectFileClick}
              >
                Select Image
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        
        {/* Generation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt (Optional)
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors"
              rows={2}
              placeholder="Optional prompt to guide the video generation"
            />
          </div>
          
          <div>
            <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Negative Prompt (Optional)
            </label>
            <textarea
              id="negative-prompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors"
              rows={2}
              placeholder="Elements to avoid in the video"
            />
          </div>
          
          {/* Advanced Settings Toggle */}
          <div className="pt-2">
            <button
              type="button"
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Sliders className="w-4 h-4 mr-1" />
              {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>
          </div>
          
          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="motion-strength" className="block text-sm font-medium text-gray-700 mb-1">
                  Motion Strength (1-255)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="motion-strength"
                    min="1"
                    max="255"
                    value={motionStrength}
                    onChange={(e) => setMotionStrength(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600 w-10 text-right">{motionStrength}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="fps" className="block text-sm font-medium text-gray-700 mb-1">
                  FPS (1-30)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="fps"
                    min="1"
                    max="30"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600 w-10 text-right">{fps}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="num-frames" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Frames (81-150)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="num-frames"
                    min="81"
                    max="150"
                    value={numFrames}
                    onChange={(e) => setNumFrames(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600 w-10 text-right">{numFrames}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="guidance-scale" className="block text-sm font-medium text-gray-700 mb-1">
                  Guidance Scale (1-15)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="guidance-scale"
                    min="1"
                    max="15"
                    step="0.1"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600 w-10 text-right">{guidanceScale.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Display progress bar when generation is running */}
          {(progress.status !== 'starting' && progress.status !== 'succeeded') && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
              <div className="flex items-center mb-2">
                <div className="animate-spin mr-2">
                  <Loader2 className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="font-medium text-gray-700">
                  {progress.status === 'processing' ? 'Generating video...' : 'Starting video generation...'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress.progress * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress.status === 'processing'
                  ? `Processing for ${Math.floor((processingTimeMs || 0) / 1000)}s, estimated ${Math.floor((estimatedTotalTimeMs || 0) / 1000)}s total`
                  : 'Starting model...'}
              </p>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start" role="alert">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Success message */}
          {successMessage && !error && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start" role="alert">
              <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* Submit button */}
          <Button 
            type="submit" 
            disabled={loading || !imageBase64} 
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Video
              </span>
            )}
          </Button>
        </form>
      </div>
      
      {/* Results area */}
      {videoUrl && (
        <div ref={resultRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Film className="w-5 h-5 mr-2 text-green-600" />
            Generated Video
          </h3>
          
          <div className="rounded-lg overflow-hidden bg-black mb-4">
            <video 
              src={videoUrl} 
              className="w-full h-auto max-h-[500px] mx-auto"
              controls
              autoPlay
              loop
              muted
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleDownloadVideo}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 