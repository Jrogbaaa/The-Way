'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageToVideoConverter from '@/components/video/ImageToVideoConverter';
import { Film, Info, Link } from 'lucide-react';
import MarkdownContent from '@/components/ui/markdown-content';

export const metadata: Metadata = {
  title: 'Image to Video Conversion | The Way',
  description: 'Convert still images into high-quality videos with motion using AI',
};

const IMAGE_TO_VIDEO_INFO = `
# Image to Video Conversion

This feature uses Replicate's **Wan 2.1 Image-to-Video** model to transform your still images into high-quality 720p videos with realistic motion.

## How it works

1. Upload an image that you want to animate
2. Add an optional text prompt to guide the video generation
3. Adjust advanced settings if needed:
   - Motion Strength: Controls how much movement appears in the video
   - FPS: Frames per second (higher = smoother but shorter)
   - Number of Frames: Total frames to generate (more frames = longer video)
   - Guidance Scale: How closely the model follows your prompt

## Tips

- For best results, use images with clear subjects and good lighting
- Adding a descriptive prompt can help guide the animation style
- Higher motion strength works well for action scenes, lower for subtle movements
- The generated video will be in MP4 format at 720p resolution
- Videos are typically 2-5 seconds long depending on settings

## Technical Details

This feature uses the [Wan 2.1 Image-to-Video model](https://replicate.com/wavespeedai/wan-2.1-i2v-720p) from Replicate.
`;

export default function ImageToVideoPage() {
  const [activeTab, setActiveTab] = useState('converter');
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
          <Film className="w-8 h-8 mr-3 text-indigo-600" />
          Image to Video Conversion
        </h1>
        <p className="text-gray-600 text-lg">
          Transform your still images into high-quality videos with realistic motion
        </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="converter" className="text-base py-3">
            <Film className="w-4 h-4 mr-2" />
            Converter
          </TabsTrigger>
          <TabsTrigger value="info" className="text-base py-3">
            <Info className="w-4 h-4 mr-2" />
            Info & Help
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="converter" className="mt-6">
          <ImageToVideoConverter />
        </TabsContent>
        
        <TabsContent value="info" className="mt-6 prose prose-indigo max-w-none">
          <MarkdownContent content={IMAGE_TO_VIDEO_INFO} />
          
          <div className="mt-8 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
            <h3 className="text-xl font-semibold text-indigo-800 mb-3">External Resources</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Link className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://replicate.com/wavespeedai/wan-2.1-i2v-720p" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Wan 2.1 Image-to-Video Model on Replicate
                </a>
              </li>
              <li className="flex items-start">
                <Link className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://github.com/wavespeed/Wan2.1" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Wan 2.1 Official GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 