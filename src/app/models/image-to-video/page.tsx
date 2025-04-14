'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageToVideoConverter from '@/components/video/ImageToVideoConverter';
import { Film, Info, Link, ArrowLeft, Video } from 'lucide-react';
import MarkdownContent from '@/components/ui/markdown-content';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';

const IMAGE_TO_VIDEO_INFO = `
# Image to Video Conversion

This feature uses Replicate's **Wan 2.1 Image-to-Video** model to transform your still images into high-quality 720p videos with realistic motion.

## How it works

1. Upload an image that you want to animate
2. Add an optional text prompt to guide the video generation
3. Adjust advanced settings if needed:
   - Motion Strength: Controls how much movement appears in the video
   - FPS: Frames per second (higher = smoother but shorter)
   - Number of Frames: Total frames to generate (minimum 81 frames, more frames = longer video)
   - Guidance Scale: How closely the model follows your prompt

## Tips

- For best results, use images with clear subjects and good lighting
- Adding a descriptive prompt can help guide the animation style
- Higher motion strength works well for action scenes, lower for subtle movements
- The generated video will be in MP4 format at 720p resolution
- Videos are typically 10-20 seconds long depending on settings

## Technical Details

This feature uses the [Wan 2.1 Image-to-Video model](https://replicate.com/wavespeedai/wan-2.1-i2v-720p) from Replicate.
`;

const LONGFORM_VIDEO_INFO = `
# Longform Video Generation

Create comprehensive narrative videos directly from text descriptions using the Hugging Face **stabilityai/stable-video-diffusion-img2vid-xt** model.

## How it works

1. Enter a detailed description of the video content you want to create
2. The system breaks down your description into scenes
3. For each scene, it generates a representative image
4. Each image is then animated to create a fluid video segment
5. All segments can be combined into a complete narrative video

## Tips

- Provide detailed, descriptive narratives for better results
- Include specific actions and movements you want to see
- Consider the flow between different scenes for a cohesive video
- The more context you provide, the better the generated video

## Technical Details

This feature uses the [stabilityai/stable-video-diffusion-img2vid-xt model](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt) from Hugging Face.
`;

export default function ImageToVideoPage() {
  const [activeTab, setActiveTab] = useState('converter');
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };
  
  const navigateToLongformVideo = () => {
    router.push(ROUTES.longformVideo);
  };
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <header className="mb-8">
        {/* Back button for mobile view */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-1 hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Image Creator</span>
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
          <Film className="w-8 h-8 mr-3 text-indigo-600" />
          Video Creation
        </h1>
        <p className="text-gray-600 text-lg">
          Convert images to videos or generate comprehensive longform videos from text
        </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="converter" className="text-base py-3">
            <Film className="w-4 h-4 mr-2" />
            Image to Video
          </TabsTrigger>
          <TabsTrigger value="longform" className="text-base py-3">
            <Video className="w-4 h-4 mr-2" />
            Longform Video
          </TabsTrigger>
          <TabsTrigger value="info" className="text-base py-3">
            <Info className="w-4 h-4 mr-2" />
            Info & Help
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="converter" className="mt-6">
          <ImageToVideoConverter />
        </TabsContent>
        
        <TabsContent value="longform" className="mt-6">
          <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Longform Video Creator</h2>
            <p className="mb-4">
              Generate comprehensive narrative videos directly from text descriptions using AI.
            </p>
            <p className="mb-6 text-white/80">
              Powered by the Hugging Face stabilityai/stable-video-diffusion-img2vid-xt model.
            </p>
            <Button 
              onClick={navigateToLongformVideo}
              size="lg"
              className="bg-white text-indigo-700 hover:bg-white/90"
            >
              Go to Longform Video Creator
            </Button>
          </div>
          
          <div className="mt-6 prose prose-indigo max-w-none">
            <MarkdownContent content={LONGFORM_VIDEO_INFO} />
          </div>
        </TabsContent>
        
        <TabsContent value="info" className="mt-6 prose prose-indigo max-w-none">
          <Tabs defaultValue="image-to-video" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="image-to-video">Image to Video</TabsTrigger>
              <TabsTrigger value="longform-video">Longform Video</TabsTrigger>
            </TabsList>
            
            <TabsContent value="image-to-video">
              <MarkdownContent content={IMAGE_TO_VIDEO_INFO} />
            </TabsContent>
            
            <TabsContent value="longform-video">
              <MarkdownContent content={LONGFORM_VIDEO_INFO} />
            </TabsContent>
          </Tabs>
          
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
                  href="https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Stable Video Diffusion Model on Hugging Face
                </a>
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 