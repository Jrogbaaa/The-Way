'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Sparkles, Filter, Clock, Star, Plus, Zap, ArrowUpRight, PlusCircle, Award, Wand2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import Link from 'next/link';
import Image from 'next/image';

// Define a model type for type safety
interface Model {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  stars: number;
  lastUsed: string;
  image: string;
  status: 'ready' | 'training' | 'failed';
  isNew: boolean;
  isFeatured: boolean;
}

export default function ModelsPage() {
  // Sample data for models (would be fetched from an API in a real app)
  const [models, setModels] = useState<Model[]>([
    {
      id: 'image-to-video',
      name: 'Image to Video',
      description: 'Convert still images into high-quality 720p videos with realistic motion',
      category: 'Video',
      tags: ['Video', 'Animation', 'Motion'],
      stars: 4.9,
      lastUsed: 'New',
      image: '/placeholder-model.jpg',
      status: 'ready',
      isNew: true,
      isFeatured: true
    },
    {
      id: '1',
      name: 'Content Generator',
      description: 'Creates compelling blog posts and social media content',
      category: 'Content',
      tags: ['Text', 'Blog', 'Social Media'],
      stars: 4.7,
      lastUsed: '2 hours ago',
      image: '/placeholder-model.jpg',
      status: 'ready',
      isNew: false,
      isFeatured: true
    },
    {
      id: '2',
      name: 'Image Enhancer',
      description: 'Professionally enhances and upscales your images',
      category: 'Image',
      tags: ['Photos', 'Upscaling'],
      stars: 4.2,
      lastUsed: '3 days ago',
      image: '/placeholder-model.jpg',
      status: 'ready',
      isNew: true,
      isFeatured: false
    },
    {
      id: '3',
      name: 'Social Media Assistant',
      description: 'Helps craft engaging posts for multiple platforms',
      category: 'Content',
      tags: ['Instagram', 'Twitter', 'TikTok'],
      stars: 4.5,
      lastUsed: 'yesterday',
      image: '/placeholder-model.jpg',
      status: 'ready',
      isNew: false,
      isFeatured: false
    },
    {
      id: '4',
      name: 'Article Summarizer',
      description: 'Quickly summarize long articles and reports',
      category: 'Content',
      tags: ['Text', 'Summaries'],
      stars: 4.1,
      lastUsed: '1 week ago',
      image: '/placeholder-model.jpg',
      status: 'training',
      isNew: false,
      isFeatured: false
    },
    {
      id: '5',
      name: 'Email Composer',
      description: 'Draft professional emails in seconds',
      category: 'Content',
      tags: ['Email', 'Business'],
      stars: 4.3,
      lastUsed: '5 days ago',
      image: '/placeholder-model.jpg',
      status: 'ready',
      isNew: false,
      isFeatured: true
    },
    {
      id: '6',
      name: 'Custom AI Chat Bot',
      description: 'Personalized chat assistant with your brand voice',
      category: 'Conversation',
      tags: ['Chat', 'Customer Service'],
      stars: 4.8,
      lastUsed: '1 day ago',
      image: '/placeholder-model.jpg',
      status: 'ready',
      isNew: true,
      isFeatured: true
    }
  ]);

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showTip, setShowTip] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  
  // Categories from the models data
  const categories = ['All', ...new Set(models.map(model => model.category))];
  
  // Filtered models based on selected category
  const filteredModels = selectedCategory === 'All' 
    ? models 
    : models.filter(model => model.category === selectedCategory);
  
  // Animate content after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    // Auto-hide tip after 8 seconds
    const tipTimer = setTimeout(() => {
      setShowTip(false);
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(tipTimer);
    };
  }, []);

  return (
    <MainLayout>
      <div className={`transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header section with title, filter, and create button */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 opacity-0 animate-slide-in space-y-4 sm:space-y-0"
          style={{
            animationDelay: '0.1s',
            animationFillMode: 'forwards'
          }}
        >
          <div className="pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center mb-2">
              <Sparkles className="h-6 w-6 mr-3 text-indigo-600" />
              My AI Models
            </h1>
            <p className="text-gray-600 text-sm">Manage and use your custom AI models</p>
          </div>
          
          <div className="flex gap-3 sm:gap-4">
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center bg-white/50 backdrop-blur-sm border-gray-200 hover:bg-white/80 transition-all px-4 py-2.5"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            <Link href="/create-model">
              <Button 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300 hover:-translate-y-1 px-4 py-2.5"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Model
              </Button>
            </Link>
          </div>
        </div>
        
        {/* AI Tip section */}
        {showTip && (
          <div 
            className="mb-8 p-4 border border-indigo-100 bg-indigo-50 rounded-xl opacity-0 animate-fade-in"
            style={{
              animationDelay: '0.2s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                <Wand2 className="h-5 w-5 text-indigo-600" />
              </div>
              
              <div className="ml-3">
                <h3 className="text-sm font-medium text-indigo-800">AI Training Tip</h3>
                <p className="mt-1 text-sm text-indigo-700">
                  Custom models perform best when trained with high-quality, diverse datasets. 
                  Consider combining different content types for more versatile results.
                </p>
                <div className="mt-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-xs bg-white border-indigo-200 text-indigo-800 hover:bg-indigo-100 transition-all duration-300"
                    onClick={() => setShowTip(false)}
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Category filters */}
        <div 
          className="mb-6 overflow-x-auto pb-2 opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.3s',
            animationFillMode: 'forwards'
          }}
        >
          <div className="flex gap-2">
            {categories.map(category => (
              <Button 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={`
                  transition-all duration-300 hover:-translate-y-1
                  ${selectedCategory === category 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-white hover:bg-gray-50 hover:border-indigo-300'
                  }
                `}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Models grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.4s',
            animationFillMode: 'forwards'
          }}
        >
          {filteredModels.map((model, index) => (
            <div 
              key={model.id} 
              className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in"
              style={{
                animationDelay: `${0.4 + (index * 0.1)}s`,
                animationFillMode: 'forwards'
              }}
            >
              {/* Status indicator */}
              {model.status === 'training' && (
                <div className="absolute top-3 right-3 text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center">
                  <Clock className="h-3 w-3 mr-1 animate-pulse" />
                  Training
                </div>
              )}
              
              {/* New tag */}
              {model.isNew && (
                <div className="absolute top-3 right-3 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  New
                </div>
              )}
              
              {/* Featured badge */}
              {model.isFeatured && (
                <div className="absolute top-3 left-3">
                  <Tooltip content="Featured Model">
                    <span className="block bg-indigo-100 p-1 rounded-full">
                      <Award className="h-4 w-4 text-indigo-600" />
                    </span>
                  </Tooltip>
                </div>
              )}
              
              <div className="flex-shrink-0 mx-auto w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4 mt-2">
                <span className="text-indigo-700 text-xl font-semibold">{model.name.charAt(0)}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-center">{model.name}</h3>
              
              <p className="mt-2 text-sm text-gray-500 text-center">{model.description}</p>
              
              <div className="mt-4 flex items-center justify-center text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 text-sm">{model.stars}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {model.lastUsed}
                </span>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                {model.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-5">
                <Link href={model.id === 'image-to-video' ? '/models/image-to-video' : '/models/sdxl'}>
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center transition-all duration-300"
                  >
                    Use Model <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          
          {/* Create model card */}
          <div 
            className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 p-6 hover:bg-indigo-50 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in"
            style={{
              animationDelay: `${0.4 + (filteredModels.length * 0.1)}s`,
              animationFillMode: 'forwards'
            }}
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-indigo-600" />
            </div>
            
            <h3 className="text-lg font-medium text-indigo-700">Create New Model</h3>
            <p className="mt-2 text-sm text-indigo-600 text-center">
              Train a custom AI model tailored to your specific needs
            </p>
            
            <Link href="/models/create" className="mt-6 w-full">
              <Button 
                className="w-full bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-in-out;
        }
      `}</style>
    </MainLayout>
  );
} 