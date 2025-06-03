'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Share2, Settings, Info, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';

// Define prompt templates
interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  description: string;
  category?: string;
}

const promptTemplates: PromptTemplate[] = [
  // Professional Photography
  {
    id: 'studio-portrait',
    name: 'Studio Portrait',
    prompt: 'a professional studio portrait with perfect lighting, high quality, 4k',
    description: 'Classic professional headshot with studio lighting',
    category: 'Professional'
  },
  {
    id: 'business-profile',
    name: 'Business Profile',
    prompt: 'a professional corporate portrait in business attire, neutral background, professional lighting, linkedin profile',
    description: 'Perfect for professional profiles and business cards',
    category: 'Professional'
  },
  {
    id: 'product-ad',
    name: 'Product Advertisement',
    prompt: 'a photo holding a product, commercial photography, professional lighting, advertisement style',
    description: 'Perfect for product promotions and advertisements',
    category: 'Professional'
  },
  
  // Lifestyle Photography
  {
    id: 'outdoor-casual',
    name: 'Outdoor Casual',
    prompt: 'a candid photo outdoors in natural lighting, casual pose, lifestyle photography',
    description: 'Natural, casual look in outdoor settings',
    category: 'Lifestyle'
  },
  {
    id: 'urban-street',
    name: 'Urban Street',
    prompt: 'a photo in an urban environment, street photography, city background, authentic style',
    description: 'Modern street style photography in city settings',
    category: 'Lifestyle'
  },
  {
    id: 'cafe-scene',
    name: 'Cafe Scene',
    prompt: 'a photo sitting in a cozy cafe, soft ambient lighting, lifestyle photography, candid moment',
    description: 'Warm, inviting cafe setting perfect for social media',
    category: 'Lifestyle'
  },
  
  // Fashion & Creative
  {
    id: 'fashion',
    name: 'Fashion Editorial',
    prompt: 'a fashion editorial photo wearing stylish clothes, magazine quality, professional photoshoot',
    description: 'High-fashion magazine style photography',
    category: 'Fashion'
  },
  {
    id: 'vintage-style',
    name: 'Vintage Style',
    prompt: 'a vintage film photograph, retro style, analog film look, 1970s aesthetic',
    description: 'Retro-inspired photography with vintage effects',
    category: 'Fashion'
  },
  {
    id: 'artistic-portrait',
    name: 'Artistic Portrait',
    prompt: 'an artistic portrait with creative lighting, dramatic shadows, cinematic mood, high contrast',
    description: 'Artistic, dramatic portrait with unique lighting',
    category: 'Fashion'
  },
  
  // Travel & Outdoor
  {
    id: 'travel',
    name: 'Travel',
    prompt: 'a photo traveling in an exotic location, travel photography, exploring, adventure',
    description: 'Perfect for travel content and location shots',
    category: 'Travel'
  },
  {
    id: 'nature-explorer',
    name: 'Nature Explorer',
    prompt: 'a photo hiking in nature, outdoor adventure photography, mountains, wilderness, golden hour lighting',
    description: 'Outdoor adventure in beautiful natural settings',
    category: 'Travel'
  },
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    prompt: 'a photo on a tropical beach, summer vibes, crystal clear water, vacation photography, sunny day',
    description: 'Sun-soaked beach scenes perfect for vacation content',
    category: 'Travel'
  }
];

// Helper function to format dates
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not available';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
};

interface ModelInfo {
  id: string;
  model_name: string;
  status: string;
  created_at: string;
  user_id: string;
  model_info?: {
    instance_prompt?: string;
    image_count?: number;
  };
  sample_image?: string;
  input_data?: {
    instancePrompt?: string;
    trainingSteps?: number;
    imageCount?: number;
  };
  error_message?: string;
  last_update?: string;
  model_url?: string;
  replicate_id?: string;
}

export default function ModelDetailPage() {
  const { modelId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  // Model info
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelValidationError, setModelValidationError] = useState<string | null>(null);

  // Check if this is a built-in model that should use its dedicated page
  const isBuiltInModel = typeof modelId === 'string' && ['bea', 'cristina', 'jaime'].includes(modelId);

  // Generation parameters
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Fetch model info on mount
  useEffect(() => {
    // Skip fetching for built-in models
    if (isBuiltInModel) {
      setLoading(false);
      return;
    }

    async function fetchModelInfo() {
      if (!modelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the new models API endpoint for better data consistency
        const response = await fetch(`/api/models/${modelId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Model not found');
          } else if (response.status === 401) {
            throw new Error('Authentication required');
          } else {
            throw new Error(`Failed to fetch model: ${response.status}`);
          }
        }
        
        const data = await response.json();
        console.log('Fetched model data:', data);
        setModel(data);
        
      } catch (err) {
        console.error('Error fetching model:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model');
      } finally {
        setLoading(false);
      }
    }

    fetchModelInfo();
  }, [modelId]);

  // Generate model default prompt
  useEffect(() => {
    if (model?.model_info?.instance_prompt) {
      setPrompt(`a professional studio photo of ${model.model_info.instance_prompt.replace('a photo of ', '')} holding a can of Red Bull`);
    }
  }, [model]);

  // Handle template selection
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    
    if (value) {
      const template = promptTemplates.find(t => t.id === value);
      if (template) {
        setPrompt(template.prompt);
      }
    }
  };

  // Generate image with the model
  const generateImage = async () => {
    if (!prompt) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for image generation",
        variant: "destructive"
      });
      return;
    }

    if (!model) {
      toast({
        title: "Model not found",
        description: "Model information is not available",
        variant: "destructive"
      });
      return;
    }
    
    setGenerating(true);
    setGeneratedImage(null);
    setModelValidationError(null); // Clear any previous validation errors
    
    try {
      // Determine which API to use based on model properties
      let apiEndpoint = '/api/modal/generate-image'; // Default to Modal
      let requestBody: any = {
        modelId,
        prompt,
        numInferenceSteps: 30, // Use default value
        guidanceScale: 7.5, // Use default value
      };

      // If the model has a model_url (Replicate-trained model), use Replicate API
      if (model.model_url || model.replicate_id) {
        apiEndpoint = '/api/replicate/generate';
        requestBody = {
          model: model.model_url || model.replicate_id,
          input: {
            prompt: prompt,
            num_inference_steps: 30, // Use default value
            guidance_scale: 7.5, // Use default value
          }
        };
      }

      console.log(`Using ${apiEndpoint} for model generation with model:`, model.model_url || model.replicate_id || modelId);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      // Check for model validation warnings (Modal API)
      if (data.usedPlaceholder && data.errorType === 'invalid_model') {
        setModelValidationError(data.modelError || 'The model file appears to be invalid or corrupted. You may need to train a new model.');
      }
      
      // Handle different response formats
      if (data.image_base64) {
        setGeneratedImage(`data:image/png;base64,${data.image_base64}`);
      } else if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error('No image data returned from server');
      }
      
    } catch (err) {
      console.error('Error generating image:', err);
      
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Download generated image
  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-${modelId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading model information...</p>
      </div>
    );
  }

  // Handle built-in models that ended up on the wrong route
  if (isBuiltInModel) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Redirecting to {modelId} Model</CardTitle>
            <CardDescription>
              This model has its own dedicated page with enhanced features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The {modelId} model has a specialized interface with additional features. 
              You'll be redirected to the proper page.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={() => router.push(`/models/${modelId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to {modelId} Model Page
            </Button>
            <Button variant="outline" onClick={() => router.push('/models')}>
              Back to Models
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Error Loading Model</CardTitle>
            <CardDescription>
              We couldn't load the model information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error || 'Model not found'}</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => router.push('/models')}>
              Back to Models
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/models')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Models
        </Button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{model.model_name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant={model.status === 'completed' ? 'success' : 'secondary'}
              className={
                model.status === 'completed'
                  ? 'bg-green-500'
                  : model.status === 'failed'
                  ? 'bg-red-500'
                  : ''
              }
            >
              {model.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {new Date(model.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Instance prompt: <span className="font-mono">{model.model_info?.instance_prompt || 'Not specified'}</span>
            {model.model_info?.image_count && (
              <> · Trained on {model.model_info.image_count} images</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/train-model')}>
            Train New Model
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/models')}>
            All Models
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate Images</CardTitle>
            <CardDescription>
              Create amazing images with your custom model. Choose a template or write your own prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Template Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Quick Start Templates</label>
                <Tooltip content="Choose a pre-made template to get started quickly, then customize it to your liking.">
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Tooltip>
              </div>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a style template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {/* Group templates by category */}
                  {Array.from(new Set(promptTemplates.map(t => t.category))).map(category => (
                    <div key={category} className="mb-2">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                        {category}
                      </div>
                      {promptTemplates
                        .filter(template => template.category === category)
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <span>{template.name}</span>
                              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            </div>
                          </SelectItem>
                        ))
                      }
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Your Prompt</label>
                <Tooltip content="Describe what you want to see in the generated image. Be specific about details, style, and lighting.">
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Tooltip>
              </div>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Describe the image you want to generate... (e.g., 'a photo of bea with a red shirt in a coffee shop')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={generating}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Be specific about details like clothing, location, lighting, and style for better results
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              onClick={generateImage} 
              disabled={generating || !prompt.trim() || (model.status !== 'completed' && model.status !== 'ready')}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating your image...
                </>
              ) : (
                'Generate Image'
              )}
            </Button>
            {!generating && (
              <p className="text-xs text-muted-foreground text-center">
                ⚡ Generation typically takes 10-15 seconds
              </p>
            )}
          </CardFooter>
        </Card>

        <div className="space-y-4">
          {/* Show generation interface for ready models */}
          {(model.status === 'completed' || model.status === 'ready') ? (
            <Tabs defaultValue="generated" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="generated">Generated</TabsTrigger>
                <TabsTrigger value="sample">Sample</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generated" className="mt-4">
                <Card className="border-dashed">
                  <CardContent className="p-0">
                    <div className="relative aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {generatedImage ? (
                        <>
                          <Image
                            src={generatedImage}
                            alt="Generated image"
                            fill
                            className="object-contain"
                          />
                          <div className="absolute bottom-2 right-2 flex gap-2">
                            <Button size="icon" variant="secondary" onClick={downloadImage}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="secondary">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">
                            {generating 
                              ? 'Generating your image...' 
                              : 'Generate an image using your custom model'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sample" className="mt-4">
                <Card className="border-dashed">
                  <CardContent className="p-0">
                    <div className="relative aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {model.sample_image ? (
                        <Image
                          src={`data:image/png;base64,${model.sample_image}`}
                          alt="Sample image"
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">No sample image available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            /* Show not ready message for models that aren't ready */
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Model Not Ready for Generation
                </h3>
                <p className="text-orange-700 mb-4">
                  {model.status === 'failed' 
                    ? 'This model failed during training and cannot generate images.'
                    : model.status === 'training' || model.status === 'processing' || model.status === 'starting'
                    ? 'This model is still in training or processing. Please wait until it\'s complete to generate images.'
                    : `Model status: ${model.status}. Cannot generate images in this state.`}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Check Status
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Prompt Tips</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-blue-700">
                <li>Be specific about what you want to see</li>
                <li>Include details about lighting, style, and background</li>
                <li>Always use your model's keyword (<span className="font-mono">{model.model_info?.instance_prompt?.replace('a photo of ', '') || 'sks person'}</span>)</li>
                <li>Add descriptive terms like "professional photo", "high quality", etc.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Parameter Tips</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-blue-700">
                <li><strong>Steps:</strong> Higher for more detail (30-40 recommended)</li>
                <li><strong>Guidance Scale:</strong> 7-9 for balanced results</li>
                <li>Try multiple variations with slight parameter changes</li>
                <li>Lower guidance scale for more creative results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {model.status === 'failed' && (
            <div className="mt-3 pt-2 border-t border-red-200">
              <p className="text-xs text-red-600">
                This model failed during training. You may need to retrain it with different settings or images.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 text-xs border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => router.push('/train-model')}
              >
                Try Training Again
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Model validation info */}
      {modelValidationError && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
          <h3 className="font-medium mb-1">Model Validation:</h3>
          <p>
            We've found an issue with the model files. The model exists in our database, 
            but there appears to be a problem with the model weights.
          </p>
          <p className="mt-2 font-mono text-xs bg-amber-100 p-2 rounded">
            {modelValidationError}
          </p>
          <div className="mt-3 pt-2 border-t border-amber-200">
            <p className="text-xs text-amber-600">
              The model will use placeholder images instead of generating real ones. You may need to train a new model.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => router.push('/train-model')}
            >
              Train New Model
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 