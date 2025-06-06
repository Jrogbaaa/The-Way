'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { runJaimeModel } from '@/lib/api/replicate';
import { ImageModal } from '@/components/ui/image-modal';
import Link from 'next/link';
import { ImageIcon, Download, Check, X, ArrowLeft, ArrowRight, XCircle, Loader2, Info, Sparkles } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';
import AdBlockerDetector from '@/components/AdBlockerDetector';
import ProgressBar from '@/components/ProgressBar';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';

export default function JaimeModelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('JAIME ');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [proxiedUrls, setProxiedUrls] = useState<Record<string, string>>({});
  const [showGeneratedOverlay, setShowGeneratedOverlay] = useState(false);
  const [overlayImageIndex, setOverlayImageIndex] = useState(0);
  
  // Suggested prompts for quick selection
  const suggestedPrompts = [
    'JAIME with a suit and tie on holding a cat, elegant portrait',
    'JAIME on a mountain hiking, adventure photography, scenic view',
    'JAIME in casual clothing at a cafe, natural lighting, lifestyle',
    'JAIME playing basketball, action shot, urban setting',
    'JAIME in a studio, professional headshot, high quality',
    'JAIME at the beach, sunset, golden hour lighting'
  ];
  
  // Refs for content
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

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
  
  // Show full-screen overlay when generation completes
  useEffect(() => {
    if (progress.status === 'succeeded' && imageUrls.length > 0) {
      setOverlayImageIndex(0);
      setShowGeneratedOverlay(true);
    }
  }, [progress.status, imageUrls.length]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push(ROUTES.signup);
      return;
    }
    
    setLoading(true);
    setError(null);
    setImageUrls([]);
    resetProgress();
    setShowGeneratedOverlay(false);
    
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

  const handleDownload = (url: string) => {
    try {
      const a = document.createElement('a');
      a.href = proxiedUrls[url] || url;
      a.download = `jaime-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
      alert('Error downloading image. Try right-click and "Save Image As..." instead.');
    }
  };
  
  // Handle selecting a suggested prompt
  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    // Focus the prompt input after selecting
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  };
  
  // Handle the full-screen overlay navigation
  const navigateOverlayImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && overlayImageIndex > 0) {
      setOverlayImageIndex(overlayImageIndex - 1);
    } else if (direction === 'next' && overlayImageIndex < imageUrls.length - 1) {
      setOverlayImageIndex(overlayImageIndex + 1);
    }
  };
  
  // Get the current image in the overlay
  const currentOverlayImage = imageUrls[overlayImageIndex] || '';
  const currentOverlayProxiedUrl = proxiedUrls[currentOverlayImage] || currentOverlayImage;
  
  // Dismiss the overlay
  const dismissGeneratedOverlay = () => {
    setShowGeneratedOverlay(false);
    
    // Scroll to the results section if it exists
    if (resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/models')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Models
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Jaime Model</h2>
        </div>
        <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          Custom Model
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Model Tips</h3>
                <p className="mb-2 text-blue-700"><strong>Include "JAIME" (all caps)</strong> in your prompt for best results.</p>
                <p className="font-medium text-blue-700">Best practices:</p>
                <ul className="list-disc pl-5 mt-1 text-blue-700">
                  <li>Be specific about poses, expressions, lighting, and backgrounds</li>
                  <li>Simple scenes yield better results</li>
                  <li>Try style descriptors: "photorealistic," "portrait photography," "cinematic lighting"</li>
                </ul>
                <p className="mt-2 text-blue-700">Examples:</p>
                <ul className="list-disc pl-5 mt-1 text-blue-700">
                  <li>JAIME in a suit, professional headshot</li>
                  <li>JAIME on a mountain, adventure photography</li>
                  <li>Close-up portrait of JAIME, studio lighting</li>
                  <li>JAIME with a dog, outdoor setting</li>
                  <li>JAIME playing basketball</li>
                </ul>
              </div>
            </div>
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
                modelName="Jaime"
              />
            </div>
          )}
          
          <div className="rounded-lg border bg-white shadow-sm mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Generate an Image</h3>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="prompt" className="text-sm font-medium">
                      Prompt
                    </label>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                      Try a suggestion
                    </span>
                  </div>
                  
                  {/* Prompt suggestions */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {suggestedPrompts.map((suggestedPrompt, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectPrompt(suggestedPrompt)}
                        className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-full transition-colors"
                      >
                        {suggestedPrompt.length > 30 
                          ? suggestedPrompt.substring(0, 30) + '...' 
                          : suggestedPrompt}
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    id="prompt"
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="JAIME in a suit, professional headshot, studio lighting"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="negative-prompt" className="text-sm font-medium">
                    Negative Prompt (Optional)
                  </label>
                  <textarea
                    id="negative-prompt"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="blurry, bad quality, distorted"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading || !prompt} 
                  className="w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
          
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
        </div>
        
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium mb-3">About Jaime Model</h3>
            <p className="text-gray-600 mb-4">
              Jaime is a custom model fine-tuned specifically for generating realistic images of Jaime in various contexts and styles.
            </p>
            
            <h4 className="font-medium text-gray-800 mb-2">Key Features:</h4>
            <ul className="space-y-1 text-gray-600 list-disc pl-5 mb-4">
              <li>Optimized for portraits and action photography</li>
              <li>Custom-trained on high-quality reference images</li>
              <li>Fine-tuned parameters for consistent results</li>
              <li>Square output format (1:1 aspect ratio)</li>
              <li>WebP format for optimal quality and file size</li>
            </ul>
            
            <h4 className="font-medium text-gray-800 mb-2">Best Used For:</h4>
            <ul className="space-y-1 text-gray-600 list-disc pl-5">
              <li>Professional headshots and portraits</li>
              <li>Adventure and outdoor scenes</li>
              <li>Sports and action photography</li>
              <li>Lifestyle and casual imagery</li>
            </ul>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Model ID: jrogbaaa/jaimecreator<br />
                Version: 25698e8acc5a...
              </p>
            </div>
          </div>
        </div>
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