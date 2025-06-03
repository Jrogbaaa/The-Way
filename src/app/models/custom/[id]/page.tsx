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
import { ReplicateTrainingLive } from '@/components/ReplicateTrainingLive';

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
    triggerWord?: string;
    trainingSteps?: number;
    imageCount?: number;
    replicateModelName?: string;
    [key: string]: any;
  };
  model_info?: any;
  sample_image?: string;
  error_message?: string;
  replicate_training_id?: string;
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
    const fetchModelDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch model details from trained_models table (Replicate training)
        const response = await fetch(`/api/replicate/training-logs/${modelId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Model details:', data);
        
        // Map the Replicate training data to our ModelDetails type
        const mappedData: ModelDetails = {
          id: data.id,
          model_name: data.modelName || 'Unnamed Model',
          status: data.status,
          progress: data.progress || 0,
          created_at: data.createdAt,
          last_update: new Date().toISOString(),
          input_data: {
            instancePrompt: data.instancePrompt,
            triggerWord: data.triggerWord,
            replicateModelName: data.modelUrl
          },
          model_info: data.model_info,
          sample_image: data.sample_image,
          error_message: data.error,
          replicate_training_id: data.replicateId
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

  // Handle refresh button click (reload page for fresh data)
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.reload();
  };

  const handleGenerateImage = async () => {
    if (!model) {
      toast.error('Model information is not available');
      return;
    }
    
    if (model.status !== 'succeeded' && model.status !== 'completed') {
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
      
      // Use Replicate API for image generation
      const response = await fetch('/api/replicate/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: model.input_data?.replicateModelName || modelId,
          prompt: promptInput,
          triggerWord: model.input_data?.triggerWord
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        console.log('Image generated successfully:', result);
        setGeneratedImage(result.imageUrl);
        toast.success('Image generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
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
                  
                  {/* Show Replicate Training Live component for in-progress training */}
                  {(model.status === 'starting' || model.status === 'processing') && model.replicate_training_id && (
                    <div className="mb-6">
                      <ReplicateTrainingLive
                        trainingId={modelId}
                        onComplete={(modelUrl) => {
                          console.log('Training completed:', modelUrl);
                          toast.success('Training completed successfully!');
                          // Refresh the model data
                          window.location.reload();
                        }}
                        onError={(error) => {
                          console.error('Training failed:', error);
                          toast.error(`Training failed: ${error}`);
                          setError(error);
                        }}
                        autoRefresh={true}
                        refreshInterval={5000}
                      />
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      model.status === 'succeeded' || model.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : model.status === 'error' || model.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {model.status === 'succeeded' || model.status === 'completed' ? (
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