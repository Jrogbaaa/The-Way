'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { runSdxlModel } from '@/lib/api/replicate';
import { ImageModal } from '@/components/ui/image-modal';
import Link from 'next/link';
import { 
  ImageIcon, 
  Download, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  XCircle, 
  Loader2, 
  Sparkles,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';
import { ImageDisplay } from '@/components/ui/image-display';

export default function SdxlModelPage() {
  const [prompt, setPrompt] = useState('');
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
  const formRef = useRef<HTMLFormElement>(null);

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
    const fakeId = `sdxl-${Date.now()}`;
    startGeneration(fakeId);
    
    try {
      const output = await runSdxlModel({
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
    try {
      // Check if the URL is valid before opening the modal
      if (typeof url !== 'string' || !url) {
        console.error('Invalid URL provided to openImageModal:', url);
        return;
      }
      
      console.log('Opening image modal for URL:', url);
      setSelectedImage(url);
    } catch (error) {
      console.error('Error opening image modal:', error);
    }
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
      const filename = url.split('/').pop() || 'sdxl-generated-image.jpg';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-2">
            <Link href="/models" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Models
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Stable Diffusion XL</h1>
          <p className="text-gray-500 mt-1">High-quality image generation with the latest SDXL model</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-md">
          <Sparkles className="h-4 w-4 mr-2" />
          Public Model
        </div>
      </div>
      
      {/* Full-screen Generated Image Overlay */}
      {showGeneratedOverlay && imageUrls.length > 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4 animate-fade-in-fast">
          {/* Close button */}
          <button 
            onClick={dismissGeneratedOverlay}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close overlay"
          >
            <XCircle className="h-8 w-8" />
          </button>
          
          {/* Success indicator */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full mb-6 flex items-center shadow-md">
            <Check className="h-5 w-5 mr-2" />
            <span className="text-lg font-medium">Image Generated Successfully!</span>
          </div>
          
          {/* Main image container */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden max-w-5xl w-full max-h-[70vh] shadow-2xl">
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
          <div className="bg-white rounded-xl p-4 mt-4 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center shadow-lg">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="font-semibold text-lg mb-1">Generated Image {overlayImageIndex + 1} of {imageUrls.length}</h3>
              <p className="text-sm text-gray-600">
                Based on prompt: "{prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt}"
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={dismissGeneratedOverlay}
                variant="outline"
                className="flex items-center hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={() => handleDownload(currentOverlayImage)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center shadow-md hover:shadow-lg transition-all"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Model Tips Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Model Tips
            </h3>
            <div className="text-blue-700 space-y-3">
              <p>This is a test page using the public Stable Diffusion XL model. Here are some tips for best results:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be specific about what you want in the image</li>
                <li>Include style descriptions like "digital art", "oil painting", or "photorealistic"</li>
                <li>Add lighting details like "cinematic lighting" or "golden hour"</li>
                <li>Use negative prompts to avoid unwanted elements</li>
              </ul>
              <p className="text-sm text-blue-600 italic mt-2">Example: "A majestic lion on a cliff at sunset, detailed fur, golden hour lighting, 4k, detailed"</p>
            </div>
          </div>
          
          {/* Display the progress bar when generation is in progress */}
          {(progress.status !== 'starting' && progress.status !== 'succeeded') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 animate-fade-in">
              <ProgressBar
                status={progress.status}
                progress={progress.progress}
                processingTimeMs={processingTimeMs}
                estimatedTotalTimeMs={estimatedTotalTimeMs}
                modelName="SDXL"
              />
            </div>
          )}
          
          {/* Form */}
          <form ref={formRef} onSubmit={handleGenerate} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate an Image</h3>
            
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors"
                rows={3}
                placeholder="A photo of an astronaut riding a horse on mars, detailed, 4k, cinematic lighting"
                required
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
                placeholder="blurry, bad quality, distorted, deformed, low resolution"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              aria-label={loading ? 'Generating image...' : 'Generate image'}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Image
                </span>
              )}
            </Button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start" role="alert">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-5 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About SDXL</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                Stable Diffusion XL is an advanced text-to-image model capable of generating high-quality images from descriptive prompts.
              </p>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Key Features:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>High resolution output (1024x1024)</li>
                  <li>Better composition and details</li>
                  <li>Improved text rendering</li>
                  <li>Enhanced aesthetic quality</li>
                  <li>Better prompt following</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Best Used For:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Concept art and illustrations</li>
                  <li>Creative content and ideation</li>
                  <li>Visual storytelling</li>
                  <li>Product visualization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results section with gallery */}
      {imageUrls.length > 0 && (
        <div ref={resultsSectionRef} className="mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Generated Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg border border-gray-200 bg-gray-100">
                <ImageDisplay
                  src={url}
                  alt={`Generated image ${index + 1}`}
                  width={512}
                  height={512}
                  className="cursor-pointer"
                  fallbackText="Image generation failed"
                  onClick={() => openImageModal(url)}
                />
                <div className="absolute bottom-0 right-0 p-2 bg-white bg-opacity-70 rounded-tl">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
} 