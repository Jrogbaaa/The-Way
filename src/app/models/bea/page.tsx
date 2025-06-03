'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/lib/config';

export default function BeaModelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(ROUTES.signup);
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const response = await fetch('/api/replicate/bea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: 'male, man, masculine, boy, male features, beard, mustache', // Use default
          num_outputs: 1, // Always generate 1 image for simplicity
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.output) {
        const imageUrls = Array.isArray(data.output) ? data.output : [data.output];
        setImages(imageUrls);
      } else {
        throw new Error('No output returned from the model');
      }
    } catch (err) {
      console.error('Error generating images:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during image generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Bea Image Generator</h1>
          <p className="text-gray-600 mb-6">
            Create amazing images of Bea! Just describe what you want to see and let the AI do the rest.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Your Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate... (e.g., 'a photo of bea with a red shirt in a coffee shop')"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none"
                required
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Be specific about details like clothing, location, lighting, and style for better results
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !prompt}
              className="w-full h-12 text-base font-semibold"
              size="lg"
              variant="default"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Generating your image...
                </span>
              ) : (
                'Generate Image'
              )}
            </Button>
            {!loading && (
              <p className="text-xs text-gray-500 text-center">
                ⚡ Generation typically takes 15-30 seconds
              </p>
            )}
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Generated Image</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-600">Creating your amazing image...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 15-30 seconds</p>
            </div>
          ) : images.length > 0 ? (
            <div className="flex justify-center">
              {images.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden max-w-md shadow-sm">
                  <a href={image} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getProxiedImageUrl(image)} 
                      alt={`Generated image of Bea`}
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-200"
                    />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-lg">Your generated image will appear here</p>
              <p className="text-sm mt-2">Enter a prompt and click generate to get started!</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">About the Bea Model</h2>
        <p className="text-gray-600 mb-4">
          The Bea Generator model is a custom-trained model that generates realistic images of Bea in various settings and styles.
          It uses advanced AI techniques to create high-quality, photorealistic outputs based on your text prompts.
        </p>
        <p className="text-gray-600 mb-4">
          For best results:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Be specific in your prompts about the setting, pose, and style you want</li>
          <li>Use the negative prompt to exclude unwanted elements</li>
          <li>Experiment with different phrasings to find what works best</li>
          <li>Remember that the model automatically includes "BEA" in your prompt</li>
        </ul>
      </div>
    </div>
  );
} 