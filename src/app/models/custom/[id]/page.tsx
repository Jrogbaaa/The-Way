'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share, Clock, Check, LucideIcon, Info, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/lib/config';
import { toast } from 'react-hot-toast';
import { getModelStatus, generateImage } from '@/lib/services/modalService';

// Define an interface for the model data
interface ModelDetails {
  id: string;
  model_name: string;
  status: string;
  progress: number;
  created_at: string;
  last_update: string;
  input_data: {
    instancePrompt?: string;
    trainingSteps?: number;
    imageCount?: number;
    [key: string]: any;
  };
  model_info?: any;
  sample_image?: string;
  error_message?: string;
}

export default function CustomModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [model, setModel] = useState<ModelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Unwrap params using React.use()
  const { id: modelId } = use(params);

  useEffect(() => {
    // Fetch the model details when the component mounts
    const fetchModelDetails = async () => {
      try {
        setLoading(true);
        
        // Use the service function instead of direct fetch
        const modelData = await getModelStatus(modelId);
        
        console.log('Model details:', modelData);
        
        if (modelData.status === 'error') {
          throw new Error(modelData.error_message || modelData.error || 'Failed to load model details');
        }
        
        // Map the response to our ModelDetails type
        const mappedData: ModelDetails = {
          id: modelData.id,
          model_name: modelData.model_name || 'Unnamed Model',
          status: modelData.status,
          progress: modelData.progress || 0,
          created_at: modelData.created_at,
          last_update: modelData.last_update || modelData.created_at,
          input_data: modelData.input_data || {},
          model_info: modelData.model_info,
          sample_image: modelData.sample_image,
          error_message: modelData.error_message
        };
        
        setModel(mappedData);
      } catch (error) {
        console.error('Error fetching model details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load model details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModelDetails();
  }, [modelId]);

  const refreshModelStatus = async (force = false) => {
    try {
      setLoading(true);
      
      // Use the service function instead of direct fetch
      // We'll need to manually add the force parameter since it's not part of the service function
      let forceUrl = '';
      if (force) {
        // This creates a URL object to safely append the query parameter
        const url = new URL(`/api/modal/model-status/${modelId}`, window.location.origin);
        url.searchParams.set('force', 'true');
        forceUrl = url.pathname + url.search;
      }
      
      const response = await fetch(forceUrl || `/api/modal/model-status/${modelId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Model details (refreshed):', data);
      
      // Map the response to our ModelDetails type
      const mappedData: ModelDetails = {
        id: data.id,
        model_name: data.model_name || 'Unnamed Model',
        status: data.status,
        progress: data.progress || 0,
        created_at: data.created_at,
        last_update: data.last_update || data.created_at,
        input_data: data.input_data || {},
        model_info: data.model_info,
        sample_image: data.sample_image,
        error_message: data.error_message
      };
      
      setModel(mappedData);
      
      if (data.status === 'completed') {
        toast.success('Model training completed!');
      } else {
        toast.success('Model status updated');
      }
    } catch (error) {
      console.error('Error refreshing model status:', error);
      toast.error('Failed to refresh model status');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click (adapted for React event handling)
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    refreshModelStatus(false);
  };

  // Handle force refresh button click (when needed)
  const handleForceRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    refreshModelStatus(true);
  };

  const handleGenerateImage = async () => {
    if (!model) {
      toast.error('Model information is not available');
      return;
    }
    
    if (model.status !== 'success' && model.status !== 'completed') {
      toast.error(`Model is not ready for generation (status: ${model.status})`);
      console.warn(`Attempted to generate with incomplete model. Status: ${model.status}, Progress: ${model.progress}%`);
      return;
    }
    
    if (!promptInput.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    try {
      setGenerating(true);
      console.log(`Generating image for model ${modelId} with prompt: ${promptInput}`);
      
      // Use the service function instead of direct fetch
      const result = await generateImage({
        modelId,
        prompt: promptInput
      });
      
      if (result.status === 'error') {
        console.error('Error generating image:', result.error, result);
        
        // Handle errors based on type
        switch (result.errorType) {
          case 'dependency':
            // Get the module name from the details or error
            const moduleMatch = result.details?.match(/module: ([a-zA-Z0-9_\-]+)/) || 
                               result.error?.match(/dependency: ([a-zA-Z0-9_\-]+)/);
            const missingModule = moduleMatch ? moduleMatch[1] : 'a required Python module';
            
            toast((t) => (
              <div>
                <p className="font-medium mb-1">Server Missing Dependencies</p>
                <p className="text-sm mb-2">The server is missing Python module: <code className="bg-gray-100 px-1 py-0.5 rounded">{missingModule}</code></p>
                <div className="text-xs text-gray-500">
                  <p className="mb-1">A placeholder image will be used instead.</p>
                  <div className="bg-amber-50 border border-amber-200 p-1.5 rounded mt-1">
                    <p className="font-medium">For Server Admin:</p>
                    <code className="block bg-gray-100 p-1 mt-1 rounded text-xs">pip install {missingModule}</code>
                  </div>
                </div>
              </div>
            ), { duration: 10000 });
            break;
            
          case 'model_status':
          case 'not_ready':
            console.log('Model not ready or status update failed. Attempting to refresh model status...');
            toast.error('Model training is not complete yet. Refreshing status...');
            
            // Try to refresh the model status and force an update
            await refreshModelStatus(true);
            
            // Check if the model status is now valid for generation
            if (model?.status === 'completed' || model?.status === 'success') {
              console.log('Model status refreshed successfully. Retrying generation...');
              toast.success('Model status updated. Retrying image generation...');
              
              // Try generation again after a short delay
              setTimeout(() => {
                handleGenerateImage();
              }, 1000);
              
              return;
            } else {
              toast.error('Model is still not ready for generation. Please try again later.');
              return;
            }
            
          case 'modal':
            // Extract specific error message
            const errorDetails = result.details || (result.error ? result.error.replace('Modal generation error:', '').trim() : 'Unknown error');
            
            // Check if it's actually a dependency error
            if (errorDetails.includes('No module named')) {
              const depMatch = errorDetails.match(/No module named ['"]([^'"]+)['"]/);
              const module = depMatch ? depMatch[1] : 'unknown';
              
              toast((t) => (
                <div>
                  <p className="font-medium mb-1">Server Missing Dependencies</p>
                  <p className="text-sm mb-2">The server is missing Python module: <code className="bg-gray-100 px-1 py-0.5 rounded">{module}</code></p>
                  <div className="text-xs text-gray-500">
                    <p className="mb-1">A placeholder image will be used instead.</p>
                    <div className="bg-amber-50 border border-amber-200 p-1.5 rounded mt-1">
                      <p className="font-medium">For Server Admin:</p>
                      <code className="block bg-gray-100 p-1 mt-1 rounded text-xs">pip install {module}</code>
                    </div>
                  </div>
                </div>
              ), { duration: 10000 });
            } else {
              toast.error(`Modal error: ${errorDetails}`);
              return; // Don't continue with generation
            }
            break;
            
          default:
            // For other errors
            toast.error(result.error || 'Failed to generate image');
            return; // Don't continue with generation
        }
      }
      
      // Continue with image display even if there were errors,
      // as the API might have returned a placeholder image
      if (result.imageUrl) {
        console.log('Image generated (or placeholder provided):', result);
        console.log('imageUrl type:', typeof result.imageUrl);
        console.log('imageUrl value:', result.imageUrl);
        
        // Ensure imageUrl is a string (handle arrays from Replicate or objects)
        let imageUrl: string | null = null;
        
        if (typeof result.imageUrl === 'string') {
          imageUrl = result.imageUrl;
        } else if (Array.isArray(result.imageUrl)) {
          imageUrl = result.imageUrl[0];
        } else if (result.imageUrl && typeof result.imageUrl === 'object') {
          // Handle case where imageUrl is unexpectedly an object
          console.warn('imageUrl is an object, attempting to extract URL:', result.imageUrl);
          
          // Try common properties that might contain the URL
          const urlObj = result.imageUrl as any;
          if (urlObj.url) {
            imageUrl = urlObj.url;
          } else if (urlObj.src) {
            imageUrl = urlObj.src;
          } else if (urlObj.href) {
            imageUrl = urlObj.href;
          } else if (Array.isArray(urlObj) && urlObj.length > 0) {
            imageUrl = urlObj[0];
          } else {
            console.error('Unable to extract URL from imageUrl object:', result.imageUrl);
            toast.error('Received invalid image URL format from server');
            return;
          }
        } else {
          console.error('imageUrl is not a string, array, or object:', result.imageUrl);
          toast.error('Invalid image URL format received');
          return;
        }
        
        if (!imageUrl || typeof imageUrl !== 'string') {
          console.error('Failed to extract valid imageUrl string:', imageUrl);
          toast.error('Unable to process image URL');
          return;
        }
        
        console.log('Final processed imageUrl:', imageUrl);
        setGeneratedImage(imageUrl);
        
        if (result.message?.includes('placeholder') || (typeof imageUrl === 'string' && imageUrl.includes('placeholder'))) {
          toast((t) => (
            <div>
              <p className="font-medium">Placeholder Image Displayed</p>
              <p className="text-sm mt-1">
                {result.message || "Using a placeholder image because the real model generation is not available."}
              </p>
            </div>
          ));
        } else {
          toast.success('Image generated successfully');
        }
      } else {
        throw new Error('No image URL returned from server');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
      
      // Special case for "failed to update" errors
      if (errorMessage.includes('Failed to update model status')) {
        toast.error('Could not prepare model for generation. Please try refreshing the model status first.');
        
        // Show a refresh button directly in the toast
        toast((t) => (
          <div>
            <p>Try refreshing the model status before generation</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => {
                toast.dismiss(t.id);
                refreshModelStatus(true);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        ), { duration: 8000 });
      } 
      // Python module dependency errors
      else if (errorMessage.includes('No module named') || errorMessage.includes('Missing Python dependency')) {
        const moduleMatch = errorMessage.match(/['"]([^'"]+)['"]/);
        const missingModule = moduleMatch ? moduleMatch[1] : 'required Python modules';
        
        toast((t) => (
          <div>
            <p className="font-medium">Missing Server Dependencies</p>
            <p className="text-sm mt-1">The server is missing Python module: <code className="bg-gray-100 px-1 py-0.5 rounded">{missingModule}</code></p>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
              Server admin needs to install the package:<br />
              <code className="bg-gray-100 px-1 py-0.5 rounded">pip install {missingModule}</code>
            </div>
          </div>
        ), { duration: 10000 });
      }
      else {
        toast.error(errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center"
          onClick={() => router.push(ROUTES.models)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Models
        </Button>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-indigo-600 text-lg">Loading model details...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Model</h2>
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(ROUTES.models)}
            >
              Return to Models
            </Button>
          </div>
        ) : model ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Model info section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-900">{model.model_name}</h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshClick}
                      className="flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  {/* Status badge */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      model.status === 'success' || model.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : model.status === 'error' || model.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {model.status === 'success' || model.status === 'completed' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Ready to use
                        </>
                      ) : model.status === 'error' || model.status === 'failed' ? (
                        <>
                          <Info className="h-3 w-3 mr-1" />
                          Failed
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          {model.status} ({model.progress || 0}%)
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Sample image */}
                  {model.sample_image && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <Image
                        src={model.sample_image}
                        alt={`Sample of ${model.model_name}`}
                        width={400}
                        height={400}
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/placeholder-model.jpg";
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Model information */}
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Model Information</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Instance Prompt:</span>
                        <span className="text-gray-900 font-medium">
                          {model.input_data?.instancePrompt || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Training Steps:</span>
                        <span className="text-gray-900 font-medium">
                          {model.input_data?.trainingSteps || 'Default'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Images Used:</span>
                        <span className="text-gray-900 font-medium">
                          {model.input_data?.imageCount || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(model.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(model.last_update)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error message if any */}
                  {model.error_message && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      <h3 className="font-medium mb-1">Error:</h3>
                      <p>{model.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Generation section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Images</h2>
                
                {model.status === 'success' || model.status === 'completed' ? (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          id="prompt"
                          placeholder="Enter a prompt to generate an image..."
                          value={promptInput}
                          onChange={(e) => setPromptInput(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={generating}
                        />
                        <Button
                          onClick={handleGenerateImage}
                          disabled={generating || !promptInput.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 rounded-l-none"
                        >
                          {generating ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Try including the instance keyword from your training prompt for best results.
                      </p>
                    </div>
                    
                    {/* Display generated image */}
                    {generatedImage && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Generated Image</h3>
                        <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                          <Image
                            src={generatedImage}
                            alt="Generated image"
                            width={800}
                            height={800}
                            className="w-full h-auto object-contain"
                            onError={(e) => {
                              console.error('Error loading generated image:', generatedImage);
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder-model.jpg";
                              toast.error("Failed to load generated image. Using fallback.");
                            }}
                          />
                          {typeof generatedImage === 'string' && generatedImage.includes('placeholders/') && (
                            <div className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-80 text-white p-2 text-center">
                              <span className="text-sm font-medium">Placeholder Image</span>
                              <p className="text-xs">Real model generation is not active. This is a placeholder image.</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex flex-col">
                          <div className="flex space-x-3 mb-2">
                            <Button variant="outline" className="flex items-center">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button variant="outline" className="flex items-center">
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                            <p><strong>Note:</strong> If you're seeing a placeholder image, please ensure:</p>
                            <ul className="list-disc pl-5 mt-1">
                              <li>Your model training has completed successfully</li>
                              <li>The USE_MODAL_GENERATION environment variable is set to "true"</li>
                              <li>All required Modal scripts are properly set up</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Model Not Ready for Generation
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {model.status === 'error' || model.status === 'failed'
                        ? 'This model has errors and cannot be used for generation.'
                        : 'This model is still in training or processing. Please wait until it\'s complete to generate images.'}
                    </p>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleRefreshClick}
                        className="flex items-center mr-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Status
                      </Button>
                      {model.progress >= 90 && (
                        <Button
                          variant="default"
                          onClick={handleForceRefreshClick}
                          className="flex items-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Force Complete Check
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">Model Not Found</h2>
            <p>The requested model could not be found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(ROUTES.models)}
            >
              Return to Models
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 