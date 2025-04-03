'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { runJaimeModel } from '@/lib/api/replicate';
import { ImageModal } from '@/components/ui/image-modal';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImageUrls([]);
    resetProgress();
    
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
      
      {imageUrls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Generated Images</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="group overflow-hidden rounded-lg border bg-card cursor-pointer relative" onClick={() => openImageModal(url)}>
                <div className="relative aspect-square">
                  <img 
                    src={proxiedUrls[url] || url} 
                    alt={`Generated image ${index + 1}`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error(`Failed to load thumbnail: ${url}`);
                      // Replace with a placeholder or error state
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
                  <span className="text-sm text-muted-foreground">Click to view full size</span>
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
    </div>
  );
} 