'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { runCristinaModel } from '@/lib/api/replicate';
import { ImageModal } from '@/components/ui/image-modal';
import Link from 'next/link';
import { ImageIcon, Download, Check, X, ArrowLeft, ArrowRight, XCircle } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';
import AdBlockerDetector from '@/components/AdBlockerDetector';
import ProgressBar from '@/components/ProgressBar';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';

export default function CristinaModelPage() {
  const [prompt, setPrompt] = useState('CRISTINA ');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [proxiedUrls, setProxiedUrls] = useState<Record<string, string>>({});
  const [showGeneratedOverlay, setShowGeneratedOverlay] = useState(false);
  const [overlayImageIndex, setOverlayImageIndex] = useState(0);
  
  // Refs for content
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
    modelName: 'Cristina',
    estimatedTime: 15000 // Estimate 15 seconds for Cristina model
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
  
  // Show full-screen overlay when generation completes
  useEffect(() => {
    if (progress.status === 'succeeded' && imageUrls.length > 0) {
      setOverlayImageIndex(0);
      setShowGeneratedOverlay(true);
    }
  }, [progress.status, imageUrls.length]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImageUrls([]);
    resetProgress();
    setShowGeneratedOverlay(false);
    
    // Start the progress indicator immediately
    const fakeId = `cristina-${Date.now()}`;
    startGeneration(fakeId);
    
    try {
      // Use all the required parameters
      const output = await runCristinaModel({
        prompt,
        negative_prompt: negativePrompt,
        model: "dev",
        go_fast: false,
        lora_scale: 1,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        guidance_scale: 3,
        output_quality: 80,
        prompt_strength: 0.8,
        extra_lora_scale: 1,
        num_inference_steps: 28
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
        failGeneration('Unexpected output format from Cristina model');
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
  
  // Handle dismissing the generated image overlay
  const dismissGeneratedOverlay = () => {
    setShowGeneratedOverlay(false);
    
    // Optionally scroll to the gallery section
    if (resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Navigate through images in the overlay
  const navigateOverlayImage = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setOverlayImageIndex(prev => 
        prev < imageUrls.length - 1 ? prev + 1 : prev
      );
    } else {
      setOverlayImageIndex(prev => 
        prev > 0 ? prev - 1 : prev
      );
    }
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
      const filename = url.split('/').pop() || 'cristina-generated-image.jpg';
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Get current overlay image
  const currentOverlayImage = imageUrls[overlayImageIndex] || '';
  const currentOverlayProxiedUrl = currentOverlayImage ? (proxiedUrls[currentOverlayImage] || currentOverlayImage) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/models" className="whitespace-nowrap">
            ← Back to Models
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Cristina Model Test</h2>
      </div>
      
      {/* Full-screen Generated Image Overlay */}
      {showGeneratedOverlay && imageUrls.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4 animate-fade-in-fast">
          {/* Close button */}
          <button 
            onClick={dismissGeneratedOverlay}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close overlay"
          >
            <XCircle className="h-8 w-8" />
          </button>
          
          {/* Success indicator */}
          <div className="bg-green-500/90 text-white px-6 py-3 rounded-full mb-6 flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span className="text-lg font-medium">Image Generated Successfully!</span>
          </div>
          
          {/* Main image container */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden max-w-5xl w-full max-h-[70vh]">
            <img 
              src={currentOverlayProxiedUrl} 
              alt="Generated image" 
              className="w-full h-full object-contain max-h-[70vh]"
              loading="eager"
            />
            
            {/* Navigation arrows for multiple images */}
            {imageUrls.length > 1 && (
              <>
                <button 
                  onClick={() => navigateOverlayImage('prev')}
                  disabled={overlayImageIndex === 0}
                  className={`absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full ${overlayImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-70'}`}
                  aria-label="Previous image"
                >
                  <ArrowLeft className="h-6 w-6 text-white" />
                </button>
                <button 
                  onClick={() => navigateOverlayImage('next')}
                  disabled={overlayImageIndex === imageUrls.length - 1}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full ${overlayImageIndex === imageUrls.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-70'}`}
                  aria-label="Next image"
                >
                  <ArrowRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}
          </div>
          
          {/* Image info and actions */}
          <div className="bg-white rounded-lg p-4 mt-4 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="font-medium text-lg mb-1">Generated Image {overlayImageIndex + 1} of {imageUrls.length}</h3>
              <p className="text-sm text-gray-600">
                Based on prompt: "{prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt}"
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={dismissGeneratedOverlay}
                variant="outline"
                className="flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={() => handleDownload(currentOverlayImage)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </Button>
            </div>
          </div>
          
          {/* Image counter for multiple images */}
          {imageUrls.length > 1 && (
            <div className="mt-4 flex gap-1">
              {imageUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setOverlayImageIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${index === overlayImageIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4" role="alert">
        <h3 className="text-lg font-semibold mb-1">Usage Tips</h3>
        <p className="mb-2"><strong>Include "CRISTINA" (all caps)</strong> in your prompt for best results.</p>
        <p className="font-medium">Best practices:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Be specific about poses, expressions, lighting, and backgrounds</li>
          <li>Simple scenes yield better results</li>
          <li>Try style descriptors: "photorealistic," "portrait photography," "cinematic lighting"</li>
        </ul>
        <p className="mt-2">Examples:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>CRISTINA in a professional setting, portrait photography</li>
          <li>CRISTINA creating content, studio lighting</li>
          <li>Close-up portrait of CRISTINA, detailed features</li>
          <li>CRISTINA in a casual outdoor setting</li>
          <li>CRISTINA with a laptop, working remotely</li>
        </ul>
      </div>
      
      <AdBlockerDetector />
      
      {/* Display the progress bar when generation is in progress */}
      {progress.status !== 'starting' && progress.status !== 'succeeded' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <ProgressBar
            status={progress.status}
            progress={progress.progress}
            processingTimeMs={processingTimeMs}
            estimatedTotalTimeMs={estimatedTotalTimeMs}
            modelName="Cristina"
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
            placeholder="CRISTINA in a professional setting, high quality, detailed"
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
      
      {/* Results section with gallery */}
      {imageUrls.length > 0 && (
        <div ref={resultsSectionRef} className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-xl font-semibold">Generated Images</h3>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {imageUrls.map((url, index) => (
              <div 
                key={index} 
                className="group overflow-hidden rounded-lg border bg-card cursor-pointer relative"
                onClick={() => {
                  setOverlayImageIndex(index);
                  setShowGeneratedOverlay(true);
                }}
              >
                <div className="relative aspect-square">
                  <img 
                    src={proxiedUrls[url] || url} 
                    alt={`Generated image ${index + 1}`} 
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
                  <span className="text-sm text-muted-foreground">Image {index + 1}</span>
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
      
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          alt="Generated image" 
          onClose={closeImageModal} 
        />
      )}
      
      <style jsx global>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in-fast {
          animation: fade-in-fast 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
} 