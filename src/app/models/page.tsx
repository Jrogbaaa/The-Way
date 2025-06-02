'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  SlidersHorizontal, 
  Sparkles, 
  Star, 
  Award,
  Filter,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import ModalModelCreation from '@/components/ModalModelCreation';
import ModalTrainingRetry from '@/components/ModalTrainingRetry';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

// Define a model type for type safety
type Model = {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  status: 'ready' | 'training' | 'failed' | 'error' | 'starting' | 'external';
  routeParam?: string;
  baseModel?: string;
  lastUsed?: string;
  isNew: boolean;
  isFeatured: boolean;
  error?: string;
  progress?: number;
  created_at: string;
  user_id: string;
  model_info?: {
    instance_prompt?: string;
    image_count?: number;
  };
};

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
  // Add new state for user-created models
  const [userModels, setUserModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    console.log(`MODELS PAGE Mounted. Loading: ${loading}, User: ${!!user}`);

    // Check if we should automatically open the model creation modal
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('create') === 'true') {
        setShowModelCreation(true);
      }
    }
    
    // Fetch user-created models when component mounts
    // In development, fetch models even if user is not authenticated to show legacy anonymous models
    if (!loading) {
      fetchUserModels();
      
      // Set up auto-refresh every 30 seconds to catch status updates
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing models...');
        fetchUserModels();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [loading, user, router]);
  
  // Add function to fetch user models from the database
  const fetchUserModels = async () => {
    try {
      console.log('🔍 Starting fetchUserModels...');
      console.log('📱 Browser info:', {
        userAgent: navigator.userAgent,
        browserName: navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other',
        cookiesEnabled: navigator.cookieEnabled,
        fetchAvailable: typeof fetch !== 'undefined',
        abortControllerAvailable: typeof AbortController !== 'undefined'
      });
      
      setIsLoadingModels(true);
      setError(null); // Clear any previous errors
      
      // Browser-specific fetch handling
      let fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      };
      
      // Add credentials for cross-origin requests, but handle Firefox differently
      if (navigator.userAgent.includes('Firefox')) {
        // Firefox can be more strict about credentials
        fetchOptions.credentials = 'same-origin';
        console.log('🦊 Using Firefox-compatible credentials: same-origin');
      } else {
        fetchOptions.credentials = 'include';
        console.log('🌐 Using standard credentials: include');
      }
      
      // Only use AbortController if available
      let controller: AbortController | undefined;
      let timeoutId: NodeJS.Timeout | undefined;
      
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        fetchOptions.signal = controller.signal;
        timeoutId = setTimeout(() => controller!.abort(), 15000); // Increased timeout for Firefox
        console.log('⏱️ AbortController configured with 15s timeout');
      } else {
        console.log('⚠️ AbortController not available');
      }
      
      console.log('📡 Making fetch request with options:', fetchOptions);
      
      const response = await fetch('/api/modal/user-models', fetchOptions);
      
      if (timeoutId) clearTimeout(timeoutId);
      
      console.log('📋 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Fetched user models:', data);
      
      // Map database models to our Model interface
      let modelsToMap = data.models || [];
      console.log('🗺️ Models to map:', modelsToMap.length);
      
      // In development, if user is authenticated but has no models, also show anonymous models
      if (user && modelsToMap.length === 0 && data.debug?.totalModelsInDb > 0) {
        console.log('🔍 User has no models but anonymous models exist, fetching all models...');
        // Fetch all models for debugging
        const allResponse = await fetch('/api/debug/models', {
          credentials: navigator.userAgent.includes('Firefox') ? 'same-origin' : 'include'
        });
        const allData = await allResponse.json();
        
        // Show anonymous models in development
        const anonymousModels = allData.database?.modelsByUser?.find((group: any) => group.userId === 'anonymous')?.models || [];
        if (anonymousModels.length > 0) {
          modelsToMap = anonymousModels.map((model: any) => ({
            id: model.id,
            model_name: model.name,
            status: model.status,
            created_at: model.created_at,
            user_id: 'anonymous',
            input_data: { instancePrompt: 'Legacy model' }
          }));
        }
      }
      
      const mappedModels = modelsToMap.map((model: any) => ({
        id: model.id,
        name: model.model_name || model.name || `Model ${model.id.slice(-8)}`,
        description: model.input_data?.instancePrompt || model.description || 'Custom trained model',
        imageUrl: model.sample_image || model.thumbnail_url || '/placeholder-model.jpg',
        status: model.status === 'completed' ? 'ready' : model.status,
        lastUsed: model.last_used ? new Date(model.last_used).toLocaleDateString() : 
                  model.updated_at ? new Date(model.updated_at).toLocaleDateString() : 'New',
        isNew: true,
        isFeatured: false,
        progress: model.progress || 0,
        error: model.error_message,
        baseModel: 'SDXL',
        routeParam: model.id,
        created_at: model.created_at,
        user_id: model.user_id,
        model_info: model.input_data
      }));
      
      console.log('✅ Mapped models for UI:', mappedModels);
      setUserModels(mappedModels);
      
    } catch (error) {
      console.error('❌ Error fetching user models:', error);
      
      // Enhanced error logging for debugging
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        browser: navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other',
        isNetworkError: error instanceof Error && error.message.includes('Failed to fetch'),
        isAbortError: error instanceof Error && error.name === 'AbortError',
        timestamp: new Date().toISOString()
      };
      
      console.error('🔍 Detailed error info:', errorDetails);
      
      // Set user-friendly error message
      let errorMessage = 'Failed to load models';
      if (errorDetails.isNetworkError) {
        errorMessage = 'Network error - please check your connection';
      } else if (errorDetails.isAbortError) {
        errorMessage = 'Request timed out - please try again';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      console.log('🏁 fetchUserModels complete');
      setIsLoadingModels(false);
    }
  };

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
  
  // Get categories for filter - replace with simple array 
  const categories = ['All']; // Simplified filter options
  
  // Filter models based on selected category
  const filteredModels = userModels; // Show all models, filtering removed

  // --- ADDED: Split models into standard and custom --- 
  const standardModels = filteredModels.filter(model => 
    ['text-to-image', 'image-to-video'].includes(model.id)
  );
  const customModels = filteredModels.filter(model => 
    ['cristina', 'jaime', 'bea'].includes(model.id)
  );
  // --- END ADDED SECTION ---

  // Add this function to the component to handle showing error details
  const renderModelStatus = (model: Model) => {
    // Check for error state
    if (model.status === 'error' || model.error) {
      return (
        <div className="mt-4">
          <ModalTrainingRetry 
            modelId={model.id} 
            errorMessage={model.error || "An error occurred during model training"}
          />
        </div>
      );
    }
    
    // Check for in-progress training
    if (model.status === 'training' || model.status === 'starting') {
      const progress = model.progress || 0;
      
      return (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Training in progress: {progress}%
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress === 0 ? (
              'Initializing...'
            ) : progress < 50 ? (
              'Training model...'
            ) : progress < 90 ? (
              'Fine-tuning parameters...'
            ) : (
              'Almost complete...'
            )}
          </p>
        </div>
      );
    }
    
    // Default complete state
    return (
      <div className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
        <CheckCircle className="h-4 w-4 mr-1" />
        Ready to use
      </div>
    );
  };

  const handleModelClick = (modelId: string) => {
    // Route to custom model detail page for user-created models
    router.push(`/models/custom/${modelId}`);
  };

  // Add function to delete a single model
  const deleteModel = async (modelId: string, modelName: string) => {
    if (!confirm(`Are you sure you want to delete "${modelName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingModelId(modelId);
    try {
      const response = await fetch(`/api/models/delete?id=${modelId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete model');
      }

      const result = await response.json();
      toast.success(`Successfully deleted "${modelName}"`);
      
      // Remove the model from the local state
      setUserModels(prev => prev.filter(model => model.id !== modelId));
      
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error(`Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingModelId(null);
    }
  };

  // Add function for bulk cleanup of failed models
  const cleanupFailedModels = async () => {
    if (!confirm('This will delete all failed and pending models except important ones like "edd". Are you sure?')) {
      return;
    }

    setIsCleaningUp(true);
    try {
      const response = await fetch('/api/models/cleanup-user', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cleanup models');
      }

      const result = await response.json();
      toast.success(`Successfully cleaned up ${result.stats.modelsDeleted} failed models`);
      
      // Refresh the models list
      await fetchUserModels();
      
    } catch (error) {
      console.error('Error cleaning up models:', error);
      toast.error(`Failed to cleanup models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading your models...</p>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className={`container max-w-screen-xl mx-auto px-4 py-8 bg-white rounded-2xl shadow-sm ${animateIn ? 'opacity-100 transition-opacity duration-500' : 'opacity-0'}`}>
          
          {/* Header with title and filters - Reduced bottom margin */}
          <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="page-title">Choose Your Model</h1>
              <p className="text-gray-600">Create amazing content with our state-of-the-art AI models</p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
                onClick={fetchUserModels}
              >
                <Filter className="h-4 w-4" />
                Refresh Models
              </Button>
              {user?.email === '11jellis@gmail.com' && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-white hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                  onClick={cleanupFailedModels}
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {isCleaningUp ? 'Cleaning...' : 'Cleanup Failed Models'}
                </Button>
              )}
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
              data-testid="create-model-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Train New Model
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
            {/* Add User-Created Models Section */}
            {userModels.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 border-gray-200 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Your Custom Models
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userModels.map((model) => (
                    <Card
                      key={model.id}
                      className="overflow-hidden hover:shadow-md transition-shadow"
                      data-testid="model-card"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleModelClick(model.id)}
                      >
                        <div className="relative aspect-square bg-muted">
                          {model.imageUrl ? (
                            <Image
                              src={model.imageUrl}
                              alt={model.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">No sample image</p>
                            </div>
                          )}
                          <Badge
                            className={
                              model.status === 'ready'
                                ? 'bg-green-500 absolute top-2 right-2'
                                : model.status === 'failed'
                                ? 'bg-red-500 absolute top-2 right-2'
                                : 'absolute top-2 right-2'
                            }
                          >
                            {model.status}
                          </Badge>
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-medium truncate">{model.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {model.model_info?.instance_prompt || 'No prompt specified'}
                          </p>
                        </CardContent>
                      </div>
                      <CardFooter className="pt-0 pb-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(model.created_at).toLocaleDateString()}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModel(model.id, model.name);
                          }}
                          disabled={deletingModelId === model.id}
                          title="Delete model"
                        >
                          {deletingModelId === model.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}
            
            {isLoadingModels && (
              <div className="flex flex-col justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                <span className="ml-3 text-indigo-600 mb-2">Loading your models...</span>
                <p className="text-sm text-gray-500 mb-4">This may take a few seconds</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    fetchUserModels();
                  }}
                  className="text-sm"
                >
                  Refresh Now
                </Button>
              </div>
            )}

            {!isLoadingModels && userModels.length === 0 && user && (
              <section className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Custom Models Yet</h3>
                  <p className="text-gray-500 mb-4">You haven't created any custom models yet. Start by training your first model.</p>
                  <Button
                    onClick={() => setShowModelCreation(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Train Your First Model
                  </Button>
                </div>
              </section>
            )}

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
                      data-testid="model-card"
                    >
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-2 h-full flex flex-col relative group">
                        <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src={model.imageUrl}
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
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{model.name}</h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{model.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="text-xs text-gray-600 py-1 px-2 bg-gray-100 rounded-full">
                                {model.status}
                              </div>
                            </div>
                            {model.lastUsed && (
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{model.lastUsed}</span>
                            )}
                          </div>
                          {renderModelStatus(model)}
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
                              src={model.imageUrl}
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
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{model.name}</h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{model.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="text-xs text-gray-600 py-1 px-2 bg-gray-100 rounded-full">
                                {model.status}
                              </div>
                            </div>
                            {model.lastUsed && (
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{model.lastUsed}</span>
                            )}
                          </div>
                          {renderModelStatus(model)}
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
                        Train New Model
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Train your own AI model
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Debug Section - Remove after fixing */}
            {process.env.NODE_ENV === 'development' && (
              <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Debug Info</h3>
                <p className="text-sm text-yellow-700">
                  Models fetched: {userModels.length} | 
                  Loading: {isLoadingModels ? 'Yes' : 'No'} | 
                  Error: {error || 'None'} |
                  User authenticated: {user ? 'Yes' : 'No'} |
                  Browser: {navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other'}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link href="/debug/models" className="text-sm bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded transition-colors">
                    🔧 Open Debug Tool
                  </Link>
                  <button 
                    onClick={() => fetchUserModels()} 
                    className="text-sm bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded transition-colors"
                  >
                    🔄 Retry Fetch
                  </button>
                </div>
                {userModels.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm font-medium text-yellow-800 cursor-pointer">
                      View Raw Model Data
                    </summary>
                    <pre className="text-xs bg-yellow-100 p-2 rounded mt-1 overflow-auto max-h-40">
                      {JSON.stringify(userModels, null, 2)}
                    </pre>
                  </details>
                )}
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
                fetchUserModels(); // Add this to refresh the list after creation
                router.push(`/models/custom/${modelInfo.id || modelInfo.model_id}`);
              }}
            />
          </div>
        </div>
      )}
      
    </MainLayout>
  );
} 