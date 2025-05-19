'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Share2, Settings, HelpCircle, Info } from 'lucide-react';
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
    prompt: 'a professional studio portrait of sks person with perfect lighting, high quality, 4k',
    description: 'Classic professional headshot with studio lighting',
    category: 'Professional'
  },
  {
    id: 'business-profile',
    name: 'Business Profile',
    prompt: 'a professional corporate portrait of sks person in business attire, neutral background, professional lighting, linkedin profile',
    description: 'Perfect for professional profiles and business cards',
    category: 'Professional'
  },
  {
    id: 'product-ad',
    name: 'Product Advertisement',
    prompt: 'a photo of sks person holding a product, commercial photography, professional lighting, advertisement style',
    description: 'Perfect for product promotions and advertisements',
    category: 'Professional'
  },
  
  // Lifestyle Photography
  {
    id: 'outdoor-casual',
    name: 'Outdoor Casual',
    prompt: 'a candid photo of sks person outdoors in natural lighting, casual pose, lifestyle photography',
    description: 'Natural, casual look in outdoor settings',
    category: 'Lifestyle'
  },
  {
    id: 'urban-street',
    name: 'Urban Street',
    prompt: 'a photo of sks person in an urban environment, street photography, city background, authentic style',
    description: 'Modern street style photography in city settings',
    category: 'Lifestyle'
  },
  {
    id: 'cafe-scene',
    name: 'Cafe Scene',
    prompt: 'a photo of sks person sitting in a cozy cafe, soft ambient lighting, lifestyle photography, candid moment',
    description: 'Warm, inviting cafe setting perfect for social media',
    category: 'Lifestyle'
  },
  
  // Fashion & Creative
  {
    id: 'fashion',
    name: 'Fashion Editorial',
    prompt: 'a fashion editorial photo of sks person wearing stylish clothes, magazine quality, professional photoshoot',
    description: 'High-fashion magazine style photography',
    category: 'Fashion'
  },
  {
    id: 'vintage-style',
    name: 'Vintage Style',
    prompt: 'a vintage film photograph of sks person, retro style, analog film look, 1970s aesthetic',
    description: 'Retro-inspired photography with vintage effects',
    category: 'Fashion'
  },
  {
    id: 'artistic-portrait',
    name: 'Artistic Portrait',
    prompt: 'an artistic portrait of sks person with creative lighting, dramatic shadows, cinematic mood, high contrast',
    description: 'Artistic, dramatic portrait with unique lighting',
    category: 'Fashion'
  },
  
  // Travel & Outdoor
  {
    id: 'travel',
    name: 'Travel',
    prompt: 'a photo of sks person traveling in an exotic location, travel photography, exploring, adventure',
    description: 'Perfect for travel content and location shots',
    category: 'Travel'
  },
  {
    id: 'nature-explorer',
    name: 'Nature Explorer',
    prompt: 'a photo of sks person hiking in nature, outdoor adventure photography, mountains, wilderness, golden hour lighting',
    description: 'Outdoor adventure in beautiful natural settings',
    category: 'Travel'
  },
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    prompt: 'a photo of sks person on a tropical beach, summer vibes, crystal clear water, vacation photography, sunny day',
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

  // Generation parameters
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [inferenceSteps, setInferenceSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Fetch model info on mount
  useEffect(() => {
    async function fetchModelInfo() {
      try {
        setLoading(true);
        const response = await fetch(`/api/modal/model-status?id=${modelId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching model: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error || 'Failed to fetch model information');
        }
        
        setModel(data);
      } catch (err) {
        console.error('Error fetching model info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    if (modelId) {
      fetchModelInfo();
    }
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
    
    if (value && model?.model_info?.instance_prompt) {
      const template = promptTemplates.find(t => t.id === value);
      if (template) {
        // Replace 'sks person' with the model's instance prompt
        const instanceText = model.model_info.instance_prompt.replace('a photo of ', '');
        const newPrompt = template.prompt.replace('sks person', instanceText);
        setPrompt(newPrompt);
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
    
    setGenerating(true);
    setGeneratedImage(null);
    setModelValidationError(null); // Clear any previous validation errors
    
    try {
      const response = await fetch('/api/modal/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          prompt,
          numInferenceSteps: inferenceSteps,
          guidanceScale: guidanceScale,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      // Check for model validation warnings 
      if (data.usedPlaceholder && data.errorType === 'invalid_model') {
        setModelValidationError(data.modelError || 'The model file appears to be invalid or corrupted. You may need to train a new model.');
      }
      
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
              Enter a prompt to generate images with your trained model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Template Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Prompt Template</label>
                <Tooltip content="Choose a pre-defined prompt style to get started quickly.">
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Tooltip>
              </div>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
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
                <label className="text-sm font-medium">Prompt</label>
                <Tooltip content="Describe what you want to see in the generated image. Be specific about details, style, and lighting.">
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Tooltip>
              </div>
              <Input
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={generating}
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Steps: {inferenceSteps}</p>
                    <Tooltip content="Higher values create more detailed images but take longer to generate. 30 is a good balance.">
                      <div className="cursor-help">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Tooltip>
                  </div>
                  <Slider
                    min={20}
                    max={50}
                    step={1}
                    value={[inferenceSteps]}
                    onValueChange={(value) => setInferenceSteps(value[0])}
                    disabled={generating}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Guidance Scale: {guidanceScale}</p>
                    <Tooltip content="Controls how closely the image follows your prompt. Higher values (7-10) give more precise results, lower values are more creative.">
                      <div className="cursor-help">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Tooltip>
                  </div>
                  <Slider
                    min={5}
                    max={15}
                    step={0.1}
                    value={[guidanceScale]}
                    onValueChange={(value) => setGuidanceScale(value[0])}
                    disabled={generating}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={generateImage} 
              disabled={generating || !prompt.trim() || model.status !== 'completed'}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
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
                            : model.status === 'completed' 
                              ? 'Generate an image using your custom model'
                              : model.status === 'failed'
                              ? 'This model failed during training and cannot generate images'
                              : `Model is ${model.status}. Cannot generate images yet.`}
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