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
import ModalModelCreation from '@/components/ModalModelCreation';

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
    case 'text-to-image':
      return '/generate/image';
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

    // Check if we should automatically open the model creation modal
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('create') === 'true') {
        setShowModelCreation(true);
      }
    }
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
      id: 'text-to-image',
      name: 'Text to Image',
      description: 'Generate images from text prompts using a standard diffusion model.',
      category: 'Image',
      tags: ['Generation', 'Text', 'General'],
      stars: 4.5,
      lastUsed: 'Ready',
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
      image: '/images/models/cristina-generator-preview.jpg',
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
      image: '/images/models/jaime-generator-preview.jpg',
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
      image: '/images/models/bea-generator-preview.jpg',
      status: 'ready',
      isNew: true,
      isFeatured: true
    }
  ]);

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showTip, setShowTip] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const [showModelCreation, setShowModelCreation] = useState(false);
  
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

  // --- ADDED: Split models into standard and custom --- 
  const standardModels = filteredModels.filter(model => 
    ['text-to-image', 'image-to-video'].includes(model.id)
  );
  const customModels = filteredModels.filter(model => 
    ['cristina', 'jaime', 'bea'].includes(model.id)
  );
  // --- END ADDED SECTION ---

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className={`container max-w-screen-xl mx-auto px-4 py-8 bg-white rounded-2xl shadow-sm ${animateIn ? 'opacity-100 transition-opacity duration-500' : 'opacity-0'}`}>
          
          {/* Header with title and filters - Reduced bottom margin */}
          <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Creator Gallery</h1>
              <p className="text-gray-600">Create amazing content with our state-of-the-art AI models</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          
          {/* Category filters & Create Button */}
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="overflow-x-auto pb-2 flex gap-2">
              {categories.map(category => (
                <Button 
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    whitespace-nowrap transition-all duration-300 px-4 py-2
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
            <Button 
              variant="default" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex-shrink-0"
              aria-label="Create a new model"
              onClick={() => setShowModelCreation(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Create Model
            </Button>
          </div>

          {/* Models count - REMOVED */}
          {/* 
          <div className="mb-6 text-sm text-gray-500">
            Showing {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'} 
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </div>
          */}
          
          {/* --- MODIFIED: Render sections --- */}
          <div className="space-y-12"> 
            {/* Standard Models Section */}  
            {standardModels.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 border-gray-200 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Standard Models
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {standardModels.map((model) => (
                    <Link
                      href={getModelRoute(model.id)}
                      key={model.id}
                      className="no-underline"
                    >
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-2 h-full flex flex-col relative group">
                        <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src={model.image}
                              alt={model.name}
                              width={300}
                              height={200}
                              className="w-full h-full object-cover rounded-t-xl transform group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; 
                                target.src = "/placeholder-model.jpg";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
                          </div>
                          {model.isNew && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm border border-green-200">New</span>
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 z-10">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm border border-blue-200">{model.category}</span>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{model.name}</h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{model.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {model.tags?.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">{tag}</span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${ i < Math.floor(model.stars) ? 'text-yellow-400 fill-yellow-400' : i < model.stars ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300 fill-gray-100' }`} />))}
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
              </section>
            )}

            {/* Custom Trained Models Section */}  
            {customModels.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 border-gray-200 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Custom Trained Models
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {customModels.map((model) => (
                    <Link
                      href={getModelRoute(model.id)}
                      key={model.id}
                      className="no-underline"
                    >
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-2 h-full flex flex-col relative group">
                        <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src={model.image}
                              alt={model.name}
                              width={300}
                              height={200}
                              className="w-full h-full object-cover rounded-t-xl transform group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; 
                                target.src = "/placeholder-model.jpg";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
                          </div>
                          <div className="absolute bottom-3 right-3 z-10">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm border border-blue-200">{model.category}</span>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{model.name}</h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{model.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {model.tags?.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">{tag}</span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${ i < Math.floor(model.stars) ? 'text-yellow-400 fill-yellow-400' : i < model.stars ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300 fill-gray-100' }`} />))}
                              </div>
                              <span className="ml-1 text-xs text-gray-600">{model.stars.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{model.lastUsed}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {/* Placeholder Create Model Card */}
                  <div 
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-400 hover:-translate-y-1 cursor-pointer h-full flex flex-col justify-center items-center group min-h-[300px]"
                    role="button"
                    tabIndex={0}
                    aria-label="Create a new model"
                    onClick={() => setShowModelCreation(true)}
                    onKeyDown={(e) => e.key === 'Enter' && setShowModelCreation(true)}
                  >
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="mb-4 p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Create a Model
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Train your own AI model
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
          {/* --- END MODIFIED SECTION --- */} 
        </div>
      </div>
      
      {/* Modal for model creation */}
      {showModelCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ModalModelCreation 
              onClose={() => setShowModelCreation(false)}
              onModelCreated={(modelInfo) => {
                // Refresh models or redirect to model page
                router.push(`/models/${modelInfo.model_name}`);
              }}
            />
          </div>
        </div>
      )}
      
    </MainLayout>
  );
} 