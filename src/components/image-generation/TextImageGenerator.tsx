'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Image as ImageIcon, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { ROUTES } from '@/lib/config';
import Link from 'next/link';

// Default Replicate model ID (e.g., SDXL)
const DEFAULT_MODEL_ID = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

// Demo image URLs for unauthenticated users
const DEMO_IMAGES = [
  'https://replicate.delivery/pbxt/4kbAkKITRSFxS8OMnuDvVaXz8HYeSJO77cYASuOUcUWw7VvIA/out-0.png',
  'https://replicate.delivery/pbxt/JfXTIEi3ZRtQxR8yHnwxjIbzlNXVNzKPGk3YyosvEzhMYPdFC/out-0.png',
  'https://replicate.delivery/pbxt/EJhfKQKdm9eBiZXHvQlKj15GgIRXaZlRHyDfwu0Q0gBn9WE/out-0.png'
];

export const TextImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const { user, loading: authLoading } = useAuth();
  
  const isAuthenticated = !!user;

  const handleGenerateImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    console.log(`Generating image for prompt: "${prompt}" using model: ${DEFAULT_MODEL_ID}`);
    const generationStartTime = Date.now();

    try {
      // For unauthenticated users, show a demo image after a simulated delay
      if (!isAuthenticated) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        const randomIndex = Math.floor(Math.random() * DEMO_IMAGES.length);
        setGeneratedImageUrl(DEMO_IMAGES[randomIndex]);
        setShowLoginPrompt(true);
        toast.success('Demo image generated! Sign in to save and create more.', { id: 'generation-toast' });
      } else {
        // For authenticated users, use the actual API
        const response = await fetch('/api/replicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: DEFAULT_MODEL_ID,
            input: {
              prompt: prompt,
              width: 1024,
              height: 1024,
              num_outputs: 1,
              // Add other relevant default parameters for the chosen model if needed
              // e.g., guidance_scale: 7.5, num_inference_steps: 25
            },
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error('API Error Response:', responseData);
          throw new Error(responseData.error || `Request failed with status ${response.status}`);
        }

        // Handle direct output vs. polling needed
        if (response.status === 201 && responseData.id) {
          // Basic Polling Implementation (can be improved with backoff, max retries)
          console.log(`Polling needed for prediction ID: ${responseData.id}`);
          toast.info('Image generation started. This may take a moment...', { id: 'generation-toast' });
          const pollResult = await pollForResult(responseData.id);
          setGeneratedImageUrl(pollResult);
        } else if (response.status === 200 && responseData.output && Array.isArray(responseData.output) && responseData.output.length > 0) {
          setGeneratedImageUrl(responseData.output[0]);
          toast.success('Image generated successfully!', { id: 'generation-toast' });
        } else {
          console.error('Unexpected API Response:', responseData);
          throw new Error('Unexpected response from image generation service.');
        }
      }
    } catch (err: any) {
      console.error('Image Generation Failed:', err);
      const errorMessage = err.message || 'An unknown error occurred during image generation.';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'generation-toast' });
    } finally {
      setIsLoading(false);
      const duration = (Date.now() - generationStartTime) / 1000;
      console.log(`Image generation process took ${duration.toFixed(2)} seconds.`);
    }
  };

  // Basic polling function
  const pollForResult = async (predictionId: string): Promise<string> => {
      let predictionStatus = null;
      let resultUrl: string | null = null;
      const maxAttempts = 20; // ~2 minutes max wait
      const pollInterval = 6000; // 6 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          try {
              // We need an endpoint to get prediction status
              // Assuming /api/replicate/predictions/[id] exists or similar
              // TODO: Create or verify a GET endpoint for prediction status
              const statusResponse = await fetch(`/api/replicate/predictions/${predictionId}`); // FAKE PATH - Needs implementation

              if (!statusResponse.ok) {
                  console.warn(`Polling failed for ${predictionId}, attempt ${attempt + 1}`);
                  continue; // Keep polling
              }

              const prediction = await statusResponse.json();
              predictionStatus = prediction.status;
              console.log(`Polling attempt ${attempt + 1}: Status = ${predictionStatus}`);

              if (predictionStatus === 'succeeded') {
                  if (prediction.output && Array.isArray(prediction.output) && prediction.output.length > 0) {
                     resultUrl = prediction.output[0];
                     toast.success('Image generated successfully!', { id: 'generation-toast' });
                     break;
                  } else {
                     throw new Error('Prediction succeeded but output was missing or invalid.');
                  }
              } else if (predictionStatus === 'failed' || predictionStatus === 'canceled') {
                  throw new Error(`Prediction ${predictionStatus}: ${prediction.error || 'No error details'}`);
              }
              // continue polling if status is starting, processing, etc.

          } catch (pollError: any) {
              console.error(`Polling error for ${predictionId}:`, pollError);
              // Decide whether to stop or continue polling on error
              if (attempt === maxAttempts - 1) { // Throw on last attempt
                 throw new Error(`Polling failed after ${maxAttempts} attempts: ${pollError.message}`);
              }
          }
      }

      if (!resultUrl) {
          throw new Error('Polling timed out or failed to get result.');
      }
      return resultUrl;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Text to image</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerateImage} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enter your prompt
            </label>
            <Input
              id="prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic cityscape at sunset"
              disabled={isLoading}
              className="w-full"
              aria-label="Image generation prompt"
            />
          </div>
          <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
          
          {!isAuthenticated && !showLoginPrompt && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Try it now! No login required for your first generation.
            </p>
          )}
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {generatedImageUrl && !isLoading && (
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-medium">Generated Image:</h3>
             <div className="relative aspect-square w-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
               <Image
                 src={generatedImageUrl}
                 alt={prompt || 'Generated image'}
                 fill
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                 className="object-contain"
                 priority={true} // Prioritize loading the generated image
                 unoptimized={generatedImageUrl.startsWith('data:')} // Avoid optimization for data URLs if needed
                 onError={(e) => {
                    console.error("Error loading generated image:", e);
                    setError("Failed to load the generated image.");
                    setGeneratedImageUrl(null); // Clear the broken image URL
                 }}
               />
             </div>
             
             {/* Login prompt for unauthenticated users after generating an image */}
             {!isAuthenticated && showLoginPrompt && (
               <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                 <h4 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-2">
                   Looks like you're enjoying this!
                 </h4>
                 <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                   Sign in to generate unlimited content, save your creations, and customize your experience.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-3">
                   <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600">
                     <Link href={ROUTES.signup}>
                       <LogIn className="mr-2 h-4 w-4" />
                       Sign Up
                     </Link>
                   </Button>
                   <Button asChild variant="outline">
                     <Link href={ROUTES.login}>
                       Already have an account? Sign In
                     </Link>
                   </Button>
                 </div>
               </div>
             )}
          </div>
        )}

        {isLoading && !error && (
           <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Generating your image...</p>
              <p className="text-sm">This can sometimes take up to a minute.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}; 