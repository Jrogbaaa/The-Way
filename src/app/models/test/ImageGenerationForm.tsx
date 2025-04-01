import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Loader2, Download } from 'lucide-react';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';

// Helper function to check if a URL is from Replicate
const isReplicateUrl = (url: string): boolean => {
  return url.includes('replicate.delivery') || url.includes('replicate.com');
};

const ImageGenerationForm: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [imageMessage, setImageMessage] = useState('');
  const [imageDebug, setImageDebug] = useState<any>(null);
  const [error, setError] = useState('');
  const [proxiedUrl, setProxiedUrl] = useState<string | null>(null);
  
  // Use our generation progress hook
  const {
    progress,
    processingTimeMs,
    estimatedTotalTimeMs,
    startGeneration,
    completeGeneration,
    failGeneration,
    reset: resetProgress
  } = useGenerationProgress({ 
    modelName: 'SDXL',
    estimatedTime: 10000 // Estimate 10 seconds for SDXL
  });
  
  // Poll for prediction status
  useEffect(() => {
    if (!progress.predictionId || progress.status !== 'processing') return;
    
    let timeoutId: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/imagen?id=${progress.predictionId}`);
        
        if (!response.ok) {
          failGeneration('Failed to check generation status');
          return;
        }
        
        const data = await response.json();
        
        // If the prediction is complete, update the image
        if (data.status === 'succeeded' && data.output && data.output.length > 0) {
          setGeneratedImage(data.output[0]);
          setImageMessage('Image generated successfully with SDXL');
          setImageDebug({
            predictionId: data.predictionId,
            processingTimeMs: data.processingTimeMs
          });
          completeGeneration(data.output[0]);
          setIsLoadingImage(false);
        } 
        // If the prediction failed, show error
        else if (data.status === 'failed') {
          failGeneration(data.error || 'Failed to generate image');
          setError(data.error || 'Failed to generate image');
          setIsLoadingImage(false);
        } 
        // Otherwise, continue polling
        else {
          timeoutId = setTimeout(checkStatus, 1000);
        }
      } catch (err) {
        console.error('Error checking prediction status:', err);
        failGeneration('Failed to check generation status');
        setError('Failed to check generation status');
        setIsLoadingImage(false);
      }
    };
    
    // Start polling immediately
    checkStatus();
    
    // Clean up if component unmounts
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [progress.predictionId, progress.status, completeGeneration, failGeneration]);

  // Generate proxied URL when we have an image
  useEffect(() => {
    if (generatedImage && !generatedImage.startsWith('data:')) {
      // For Replicate images, we want to use our proxy API
      if (isReplicateUrl(generatedImage)) {
        setProxiedUrl(getProxiedImageUrl(generatedImage));
      } else {
        setProxiedUrl(generatedImage);
      }
    } else {
      setProxiedUrl(null);
    }
  }, [generatedImage]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setGeneratedImage('');
    setImageMessage('');
    setImageDebug(null);
    setProxiedUrl(null);
    resetProgress();
    
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoadingImage(true);
    
    try {
      const response = await fetch('/api/imagen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          numOutputs: 1,
          waitForResult: false // Use the new async flow
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.predictionId) {
        // Start tracking generation progress
        startGeneration(data.predictionId);
      } else {
        throw new Error('No prediction ID returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoadingImage(false);
      failGeneration(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const download = async () => {
      try {
        // For Replicate images, prefer a proxied URL to avoid CORS issues
        const downloadUrl = proxiedUrl || generatedImage;
        
        // Create a download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `sdxl-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Failed to download image:', err);
        alert('Failed to download the image. Please try right-clicking and "Save Image As..." instead.');
      }
    };
    
    download();
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Prompt
              </label>
              <textarea
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="negativePrompt" className="text-sm font-medium">
                Negative Prompt (Optional)
              </label>
              <textarea
                id="negativePrompt"
                placeholder="Things to exclude from the image..."
                value={negativePrompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNegativePrompt(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoadingImage || !prompt}
              className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </button>
          </form>
        </div>
      </div>

      {progress.status !== 'starting' && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <ProgressBar
            status={progress.status}
            progress={progress.progress}
            processingTimeMs={processingTimeMs}
            estimatedTotalTimeMs={estimatedTotalTimeMs}
            modelName="SDXL"
          />
        </div>
      )}
      
      {generatedImage && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Generated Image</h3>
                {imageMessage && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    {imageMessage}
                  </span>
                )}
              </div>
              
              <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={proxiedUrl || generatedImage}
                  alt="Generated image from prompt"
                  width={512}
                  height={512}
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error(`Failed to load image: ${generatedImage}`);
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='10' text-anchor='middle' alignment-baseline='middle' fill='%23999999'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                  }}
                  priority
                  unoptimized
                />
                <button
                  onClick={handleDownload}
                  className="absolute bottom-2 right-2 bg-white text-gray-800 rounded-md px-3 py-1 text-sm shadow-sm border flex items-center"
                  title="Download image"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Save
                </button>
              </div>
              
              {generatedImage.startsWith('data:image') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <p className="font-medium">Error generating image</p>
                  <p className="mt-1">The SDXL model encountered an error. Please check if Replicate API token is set correctly.</p>
                  <pre className="mt-2 p-2 bg-gray-100 text-gray-800 rounded overflow-x-auto text-xs">
                    REPLICATE_API_TOKEN=your_replicate_api_token
                  </pre>
                </div>
              )}
              
              {imageDebug && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">
                    {typeof imageDebug === 'string' ? imageDebug : JSON.stringify(imageDebug, null, 2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerationForm; 