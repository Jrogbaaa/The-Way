'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { runJaimeModel } from '@/lib/api/replicate';
import { ImageModal } from '@/components/ui/image-modal';
import Link from 'next/link';
import { ImageIcon, Download, Check } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';
import AdBlockerDetector from '@/components/AdBlockerDetector';
import ProgressBar from '@/components/ProgressBar';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';

export default function JaimeModelPage() {
  const [prompt, setPrompt] = useState('JAIME ');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [proxiedUrls, setProxiedUrls] = useState<Record<string, string>>({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Refs for scrolling
  const resultsSectionRef = useRef<HTMLDivElement>(null);

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
    modelName: 'Jaime',
    estimatedTime: 15000 // Estimate 15 seconds for Jaime model
  });

  // Generate proxied URLs for all images
  useEffect(() => {
    if (imageUrls.length) {
      const newProxiedUrls: Record<string, string> = {};
      
      // Filter out non-string URLs
      imageUrls.filter(url => typeof url === 'string').forEach(url => {
        newProxiedUrls[url] = getProxiedImageUrl(url);
      });
      
      setProxiedUrls(newProxiedUrls);
    }
  }, [imageUrls]);
  
  // Scroll to results when generation completes
  useEffect(() => {
    if (progress.status === 'succeeded' && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowSuccessPopup(true);
      
      // Auto-hide the success popup after 5 seconds
      const timerId = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 5000);
      
      return () => clearTimeout(timerId);
    }
  }, [progress.status]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImageUrls([]);
    resetProgress();
    setShowSuccessPopup(false);
    
    // Start the progress indicator immediately
    const fakeId = `jaime-${Date.now()}`;
    startGeneration(fakeId);
    
    try {
      const output = await runJaimeModel({
        prompt,
        negative_prompt: negativePrompt,
        num_outputs: 1,
      });
      
      // The output is typically an array of image URLs
      if (Array.isArray(output)) {
        setImageUrls(output);
        // Complete the progress with the first image URL
        if (output.length > 0) {
          completeGeneration(output[0]);
        } else {
          failGeneration('No images were generated');
        }
      } else if (typeof output === 'string') {
        setImageUrls([output]);
        completeGeneration(output);
      } else {
        console.error('Unexpected output format:', output);
        setImageUrls([]);
        failGeneration('Unexpected output format');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      failGeneration(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (url: string) => {
    setSelectedImage(url);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };
  
  // Handle downloading the image
  const handleDownload = async (url: string) => {
    try {
      // Use proxied URL for download
      const proxiedUrl = proxiedUrls[url] || url;
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Extract filename from URL or use a default
      const filename = url.split('/').pop() || 'jaime-generated-image.jpg';
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/models" className="whitespace-nowrap">
            ← Back to Models
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Jaime Model Test</h2>
      </div>
      
      {/* Success popup that appears when image generation is complete */}
      {showSuccessPopup && imageUrls.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <div className="flex-1">
            <p className="font-medium">Image generated successfully!</p>
            <p className="text-sm">Scroll down to view your image.</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-4 bg-white"
            onClick={() => setShowSuccessPopup(false)}
          >
            Dismiss
          </Button>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4" role="alert">
        <h3 className="text-lg font-semibold mb-1">Usage Tips</h3>
        <p className="mb-2"><strong>Include "JAIME" (all caps)</strong> in your prompt for best results.</p>
        <p className="font-medium">Best practices:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Be specific about poses, expressions, lighting, and backgrounds</li>
          <li>Simple scenes yield better results</li>
          <li>Try style descriptors: "photorealistic," "portrait photography," "cinematic lighting"</li>
        </ul>
        <p className="mt-2">Examples:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>JAIME in a suit, professional headshot</li>
          <li>JAIME on a mountain, adventure photography</li>
          <li>Close-up portrait of JAIME, studio lighting</li>
          <li>JAIME with a dog, outdoor setting</li>
          <li>JAIME playing basketball</li>
        </ul>
      </div>
      
      <AdBlockerDetector />
      
      {/* Display the progress bar when generation is in progress */}
      {progress.status !== 'starting' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <ProgressBar
            status={progress.status}
            progress={progress.progress}
            processingTimeMs={processingTimeMs}
            estimatedTotalTimeMs={estimatedTotalTimeMs}
            modelName="Jaime"
          />
        </div>
      )}
      
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
            placeholder="JAIME in a suit, professional headshot, studio lighting"
            required
          />
        </div>
        
        <div>
          <label htmlFor="negative-prompt" className="block text-sm font-medium mb-1">
            Negative Prompt (Optional)
          </label>
          <textarea
            id="negative-prompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={2}
            placeholder="blurry, bad quality, distorted"
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full"
          aria-label={loading ? 'Generating image...' : 'Generate image'}
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
      </form>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}
      
      {/* Results section with ref for scrolling */}
      {imageUrls.length > 0 && (
        <div ref={resultsSectionRef} className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-xl font-semibold">Generated Image</h3>
          
          {/* Display the most recent image prominently */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="relative aspect-square max-h-[600px]">
              <img 
                src={proxiedUrls[imageUrls[0]] || imageUrls[0]} 
                alt="Generated image" 
                className="w-full h-full object-contain"
                loading="eager"
                onError={(e) => {
                  console.error(`Failed to load image: ${imageUrls[0]}`);
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='10' text-anchor='middle' alignment-baseline='middle' fill='%23999999'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="p-4 flex justify-between items-center bg-gray-50">
              <div className="flex items-center">
                <span className="text-sm font-medium">Generated from: "{prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}"</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openImageModal(imageUrls[0])}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleDownload(imageUrls[0])}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
          
          {/* If there are multiple images, show them in a grid */}
          {imageUrls.length > 1 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-3">Additional Images</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {imageUrls.slice(1).map((url, index) => (
                  <div key={index + 1} className="group overflow-hidden rounded-lg border bg-card cursor-pointer relative" onClick={() => openImageModal(url)}>
                    <div className="relative aspect-square">
                      <img 
                        src={proxiedUrls[url] || url} 
                        alt={`Generated image ${index + 2}`} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error(`Failed to load thumbnail: ${url}`);
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='10' text-anchor='middle' alignment-baseline='middle' fill='%23999999'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button 
                          className="bg-white rounded-full p-2 shadow-lg"
                          aria-label="View full size image"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 border-t flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Click to view</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(url);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          alt="Generated image" 
          onClose={closeImageModal} 
        />
      )}
    </div>
  );
} 