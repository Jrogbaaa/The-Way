'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  SlidersHorizontal, 
  Sparkles, 
  Star, 
  Award,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

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
  status: 'ready' | 'training' | 'failed' | 'external';
  isNew: boolean;
  isFeatured: boolean;
}

// Helper function to get the correct route for each model
const getModelRoute = (modelId: string) => {
  // Default routes for built-in models
  switch (modelId) {
    case 'image-to-video':
      return '/models/image-to-video';
    case 'cristina':
      return '/models/cristina';
    case 'jaime':
      return '/models/jaime';
    case 'bea':
      return '/models/bea';
    default:
      return '/models/sdxl';
  }
};

export default function ImageCreatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log(`MODELS PAGE Mounted. Loading: ${loading}, User: ${!!user}`);
  }, [loading, user, router]);

  // Sample data for models
  const [models, setModels] = useState<Model[]>([
    {
      id: 'image-to-video',
      name: 'Image to Video',
      description: 'Convert still images into high-quality 720p videos with realistic motion',
      category: 'Video',
      tags: ['Video', 'Animation', 'Motion'],
      stars: 4.9,
      lastUsed: 'New',
      image: '/images/models/image-to-video.jpg',
      status: 'ready',
      isNew: true,
      isFeatured: true
    },
    {
      id: 'cristina',
      name: 'Cristina Model',
      description: 'Generate realistic images of Cristina with customizable parameters',
      category: 'Image',
      tags: ['Generation', 'Photos', 'AI Model'],
      stars: 4.8,
      lastUsed: '1 day ago',
      image: '/images/models/cristina-model.jpg',
      status: 'ready',
      isNew: false,
      isFeatured: true
    },
    {
      id: 'jaime',
      name: 'Jaime Model',
      description: 'Create customized images of Jaime for various contexts and styles',
      category: 'Image',
      tags: ['Generation', 'Photos', 'AI Model'],
      stars: 4.7,
      lastUsed: '3 days ago',
      image: '/images/models/jaime-model.jpg',
      status: 'ready',
      isNew: false,
      isFeatured: true
    },
    {
      id: 'bea',
      name: 'Bea Generator',
      description: 'Generate realistic images of Bea in various settings and compositions',
      category: 'Image',
      tags: ['Generation', 'Photos', 'AI Model'],
      stars: 4.9,
      lastUsed: 'New',
      image: '/images/models/bea-model.jpg',
      status: 'ready',
      isNew: true,
      isFeatured: true
    }
  ]);

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showTip, setShowTip] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  // Get categories for filter
  const categories = ['All', ...Array.from(new Set(models.map(model => model.category)))];
  
  // Filter models based on selected category
  const filteredModels = selectedCategory === 'All' 
    ? models 
    : models.filter(model => model.category === selectedCategory);

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-10">
        <div className={`container max-w-screen-xl mx-auto px-4 py-8 bg-white rounded-2xl shadow-sm ${animateIn ? 'opacity-100 transition-opacity duration-500' : 'opacity-0'}`}>
          
          {/* Header with title and filters */}
          <div className="flex justify-between items-center mb-10 flex-col sm:flex-row gap-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Image Creator Gallery</h1>
              <p className="text-gray-600">Create amazing content with our state-of-the-art AI models</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          
          {/* Category filters */}
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex gap-2">
              {categories.map(category => (
                <Button 
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    transition-all duration-300 px-4 py-2
                    ${selectedCategory === category 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' 
                      : 'bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm'
                    }
                  `}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Models count */}
          <div className="mb-6 text-sm text-gray-500">
            Showing {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'} 
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </div>
          
          {/* Models grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModels.map((model, index) => (
              <Link
                href={getModelRoute(model.id)}
                key={model.id}
                className="no-underline"
              >
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-2 h-full flex flex-col relative group">
                  <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src={model.image}
                        alt={model.name}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover rounded-t-xl transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fall back to a generated placeholder on error
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          target.src = "/placeholder-model.jpg";
                        }}
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
                    </div>
                    
                    {model.isNew && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm border border-green-200">
                          New
                        </span>
                      </div>
                    )}
                    
                    {/* Model category tag */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm border border-blue-200">
                        {model.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{model.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{model.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {model.tags?.slice(0, 3).map((tag) => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < Math.floor(model.stars) 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : i < model.stars 
                                    ? 'text-yellow-400 fill-yellow-200' 
                                    : 'text-gray-300 fill-gray-100'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-600">{model.stars.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{model.lastUsed}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 