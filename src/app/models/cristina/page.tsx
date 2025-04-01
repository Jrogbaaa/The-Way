'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { runCristinaModel } from '@/lib/api/replicate';
import { ImageModal } from '@/components/ui/image-modal';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/config';
import MainLayout from '@/components/layout/MainLayout';
import AdBlockerDetector from '@/components/AdBlockerDetector';

type ContentExample = {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin';
};

export default function CristinaModelPage() {
  const [prompt, setPrompt] = useState('CRISTINA ');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [proxiedUrls, setProxiedUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'settings' | 'analytics'>('overview');
  const [contentExamples, setContentExamples] = useState<ContentExample[]>([
    {
      id: '1',
      title: 'Morning Coffee Motivation',
      content: "Starting the day with intention and a great cup of coffee. What are your morning rituals that set you up for success? #MorningRoutine #ProductivityTips",
      image: "/placeholder-coffee.jpg",
      date: '2023-10-25',
      engagement: { likes: 278, shares: 42, comments: 36 },
      platform: 'instagram',
    },
    {
      id: '2',
      title: 'Home Office Setup',
      content: "Just upgraded my home office with some plants and better lighting. Small changes can make such a big difference in productivity and mood! What's your favorite home office hack? #WorkFromHome #HomeOffice",
      image: "/placeholder-office.jpg",
      date: '2023-10-18',
      engagement: { likes: 412, shares: 87, comments: 64 },
      platform: 'linkedin',
    },
    {
      id: '3',
      title: 'Weekend Reading List',
      content: "My weekend reading stack is ready! Three books that I'm excited to dive into on creativity, productivity, and mindfulness. What are you reading this weekend? #WeekendReads #BookRecommendations",
      image: "/placeholder-books.jpg",
      date: '2023-10-12',
      engagement: { likes: 189, shares: 23, comments: 41 },
      platform: 'twitter',
    },
  ]);
  
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
    estimatedTime: 15000 // Estimate 15 seconds for Cristina
  });

  // Generate proxied URLs for all images
  useEffect(() => {
    if (imageUrls.length) {
      console.log('Creating proxied URLs for:', imageUrls);
      const newProxiedUrls: Record<string, string> = {};
      
      // Filter out non-string URLs
      imageUrls.filter(url => typeof url === 'string').forEach(url => {
        const proxiedUrl = getProxiedImageUrl(url);
        console.log(`Original URL: ${url} => Proxied URL: ${proxiedUrl}`);
        newProxiedUrls[url] = proxiedUrl;
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
      
      // Debug output
      console.log('Cristina model output:', output);
      
      // The output is typically an array of image URLs
      if (Array.isArray(output)) {
        console.log('Setting image URLs array:', output);
        setImageUrls(output);
        
        // Complete the progress with the first image URL
        if (output.length > 0) {
          completeGeneration(output[0]);
        } else {
          failGeneration('No images were generated');
        }
      } else if (typeof output === 'string') {
        console.log('Setting single image URL:', output);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={ROUTES.models}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Model Info Column */}
          <div className="w-full md:w-1/3">
            <div className="bg-white border rounded-lg shadow-sm p-6 dark:bg-gray-950 dark:border-gray-800">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center dark:bg-purple-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12 text-purple-600 dark:text-purple-400"
                  >
                    <path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12Z" />
                    <path d="M12 9h.01" />
                    <path d="M12 13h.01" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Cristina</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Social Content Creator</p>
                <div className="flex justify-center mt-2">
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="mt-1 text-sm">
                    Trained to generate engaging social media content with a personal touch. 
                    Specializes in lifestyle, professional, and motivational content.
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance</h3>
                  <div className="space-y-3 mt-2">
                    <div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Accuracy</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div className="h-full bg-purple-600 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Reliability</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div className="h-full bg-purple-600 rounded-full" style={{width: '88%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Speed</span>
                        <span className="font-medium">95%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div className="h-full bg-purple-600 rounded-full" style={{width: '95%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Usage Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold">1,247</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Uses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">23</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                  <p className="mt-1 text-sm">October 15, 2023</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Column */}
          <div className="w-full md:w-2/3">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden dark:bg-gray-950 dark:border-gray-800">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'overview'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('examples')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'examples'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    Content Examples
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'settings'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'analytics'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    Analytics
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-2">About Cristina</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Cristina is an AI-powered content creator specializing in social media posts. 
                        Trained on thousands of high-performing posts, she helps you create engaging content 
                        that resonates with your audience while maintaining your personal voice and brand style.
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-medium mb-2">Capabilities</h2>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>Generate original social media posts optimized for different platforms</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>Adapt content tone from professional to casual based on audience</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>Create engaging captions for images and videos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>Generate hashtag sets optimized for each platform</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>Schedule optimal posting times based on engagement analysis</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-center pt-4">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto"
                        onClick={() => setActiveTab('settings')}
                      >
                        Create Content with Cristina
                      </Button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'examples' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium">Content Examples</h2>
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </div>
                    
                    <div className="space-y-6">
                      {contentExamples.map((example) => (
                        <div 
                          key={example.id}
                          className="border rounded-lg overflow-hidden dark:border-gray-800"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium">{example.title}</h3>
                              <Badge
                                variant={
                                  example.platform === 'instagram' ? 'info' :
                                  example.platform === 'twitter' ? 'default' :
                                  example.platform === 'linkedin' ? 'success' : 'secondary'
                                }
                              >
                                {example.platform.charAt(0).toUpperCase() + example.platform.slice(1)}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {example.content}
                            </p>
                            
                            {example.image && (
                              <div className="relative h-48 bg-gray-100 rounded-md overflow-hidden dark:bg-gray-800">
                                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                  [Image placeholder: {example.image}]
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                              <span>{example.date}</span>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 mr-1"
                                  >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                  </svg>
                                  <span>{example.engagement.likes}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 mr-1"
                                  >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                  </svg>
                                  <span>{example.engagement.comments}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 mr-1"
                                  >
                                    <path d="M17 2l4 4-4 4"></path>
                                    <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                                    <path d="M7 22l-4-4 4-4"></path>
                                    <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                                  </svg>
                                  <span>{example.engagement.shares}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center pt-4">
                      <Button variant="outline">Load More Examples</Button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-4">Image Generation</h2>
                      
                      <form onSubmit={handleGenerate} className="space-y-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                        <AdBlockerDetector />
                        
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300" role="alert">
                          <h3 className="text-lg font-semibold mb-1">Usage Tips</h3>
                          <p className="mb-2"><strong>Include "CRISTINA" (all caps)</strong> in your prompt for best results.</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">Try adding style descriptors like "photorealistic," "portrait photography," or "cinematic lighting".</p>
                        </div>
                      
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
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
                          {error}
                        </div>
                      )}
                      
                      {imageUrls.length > 0 && (
                        <div className="space-y-4 mb-6">
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
                      
                      <h2 className="text-lg font-medium mb-4">Model Settings</h2>
                      
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Content Style</label>
                          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 dark:border-gray-700 dark:bg-gray-900">
                            <option value="casual">Casual & Friendly</option>
                            <option value="professional">Professional & Polished</option>
                            <option value="informative">Informative & Educational</option>
                            <option value="motivational">Motivational & Inspirational</option>
                            <option value="humorous">Humorous & Light-hearted</option>
                          </select>
                        </div>
                        
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Content Length</label>
                          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 dark:border-gray-700 dark:bg-gray-900">
                            <option value="short">Short (Under 80 characters)</option>
                            <option value="medium">Medium (80-150 characters)</option>
                            <option value="long">Long (150-280 characters)</option>
                            <option value="extended">Extended (Multiple paragraphs)</option>
                          </select>
                        </div>
                        
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Primary Platform</label>
                          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 dark:border-gray-700 dark:bg-gray-900">
                            <option value="instagram">Instagram</option>
                            <option value="twitter">Twitter</option>
                            <option value="facebook">Facebook</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="tiktok">TikTok</option>
                          </select>
                        </div>
                        
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Industry Focus</label>
                          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 dark:border-gray-700 dark:bg-gray-900">
                            <option value="tech">Technology</option>
                            <option value="health">Health & Wellness</option>
                            <option value="finance">Finance & Business</option>
                            <option value="creative">Creative & Design</option>
                            <option value="education">Education & Learning</option>
                            <option value="lifestyle">Lifestyle & Personal</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Include Hashtags</label>
                          </div>
                          <div className="relative inline-flex items-center">
                            <input type="checkbox" className="sr-only" id="hashtags" defaultChecked />
                            <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 dark:bg-gray-700"></div>
                            <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 dark:bg-gray-400"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Include Emojis</label>
                          </div>
                          <div className="relative inline-flex items-center">
                            <input type="checkbox" className="sr-only" id="emojis" defaultChecked />
                            <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 dark:bg-gray-700"></div>
                            <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 dark:bg-gray-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-2">
                      <Button variant="outline">Reset to Default</Button>
                      <Button>Save Settings</Button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-4">Performance Analytics</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="border rounded-lg p-4 dark:border-gray-800">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Content Generation</h3>
                          <p className="text-2xl font-bold">1,247</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total posts generated</p>
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 mr-1"
                            >
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                              <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                            <span>12% increase this month</span>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4 dark:border-gray-800">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Average Engagement</h3>
                          <p className="text-2xl font-bold">4.7%</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Across all platforms</p>
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 mr-1"
                            >
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                              <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                            <span>0.8% increase this month</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Platform Performance</h3>
                        <div className="space-y-4 mt-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Instagram</span>
                              <span className="text-sm font-medium">65%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                              <div className="h-full bg-pink-500 rounded-full" style={{width: '65%'}}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Twitter</span>
                              <span className="text-sm font-medium">48%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                              <div className="h-full bg-blue-500 rounded-full" style={{width: '48%'}}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">LinkedIn</span>
                              <span className="text-sm font-medium">72%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                              <div className="h-full bg-blue-700 rounded-full" style={{width: '72%'}}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">Facebook</span>
                              <span className="text-sm font-medium">41%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                              <div className="h-full bg-blue-600 rounded-full" style={{width: '41%'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-center">
                      <Button variant="outline">View Detailed Analytics</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 