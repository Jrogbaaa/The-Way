'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function TestGeminiPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add timestamp to bust cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/test-gemini-image?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate image');
      }
      
      // For images, we need to create a blob URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'An error occurred while generating the image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="flex items-center mb-8">
        <Link 
          href="/dashboard" 
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Test Gemini Image Generation</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gemini Image Generation Test</CardTitle>
          <CardDescription>
            This is a simple test to check if the Gemini API is capable of generating images.
            It will help diagnose issues with the Photo Editor feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Button 
              onClick={generateImage} 
              disabled={isLoading}
              size="lg"
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Image...
                </>
              ) : (
                'Generate Test Image'
              )}
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {imageUrl && (
            <div className="flex flex-col items-center">
              <p className="text-green-600 font-medium mb-2">✓ Image generated successfully!</p>
              <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm w-full max-w-md">
                <img 
                  src={imageUrl}
                  alt="Generated test image" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-3">
          <p className="text-sm text-gray-500">
            This endpoint directly calls the Gemini 2.0 Flash experimental image generation model
            using the same API key as the Photo Editor.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 