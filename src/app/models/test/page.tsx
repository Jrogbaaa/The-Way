'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ImageGenerationForm from './ImageGenerationForm';

export default function TestModelPage() {
  // We no longer need to check for Imagen configuration
  // The app will use Replicate SDXL which is already configured

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/models">
            ← Back to Models
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Test Model (Standard Generations)</h2>
      </div>
      
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
        <h3 className="text-lg font-semibold mb-1">Using Replicate SDXL Model</h3>
        <p>This is now using Replicate's Stable Diffusion XL model for high-quality image generation.</p>
        <p className="text-xs text-gray-600 mt-2">Note: The original Google Vertex AI Imagen integration has been replaced with Replicate SDXL due to quota limitations.</p>
      </div>
      
      <ImageGenerationForm />
    </div>
  );
} 