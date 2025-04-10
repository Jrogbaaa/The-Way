'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, HelpCircle, AlertTriangle, Info, CheckCircle2, ArrowLeft, Clock, Zap } from 'lucide-react';
import { ModelCreationFormData } from '@/lib/types';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Tooltip component for displaying helpful information
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Show help information"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      
      {isVisible && (
        <div className="absolute left-full top-0 z-10 ml-2 w-64 rounded-md bg-gray-800 px-3 py-2 text-xs text-white shadow-lg animate-fade-in">
          {content}
          <div className="absolute -left-1 top-3 h-2 w-2 rotate-45 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
};

// Training tips section to display before starting
const TrainingTipsGuide = ({ onClose }: { onClose: () => void }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm animate-fade-in">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-blue-800 flex items-center">
        <Info className="h-5 w-5 mr-2" />
        Training Guide: Getting Started
      </h3>
      <button 
        onClick={onClose}
        className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
        aria-label="Close guide"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
    
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-blue-800 mb-1">What makes good training data?</h4>
        <p className="text-sm text-blue-700">
          Upload 15-20 high-quality images of your subject. For best results:
        </p>
        <ul className="text-sm text-blue-700 list-disc list-inside mt-1">
          <li>Use a variety of poses, angles, and backgrounds</li>
          <li>Include close-ups and full-body shots (for people/characters)</li>
          <li>Use consistent lighting and clear images</li>
          <li>Avoid other people or subjects in the same images</li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium text-blue-800 mb-1">Training Process Expectations</h4>
        <p className="text-sm text-blue-700">
          Training takes 30-60 minutes depending on your settings. Higher resolution and more epochs take longer but may produce better results.
        </p>
      </div>
      
      <div>
        <h4 className="font-medium text-blue-800 mb-1">After Training Completes</h4>
        <p className="text-sm text-blue-700">
          Your model will appear in your Models dashboard automatically. You can then generate images using your new model from the dashboard.
        </p>
      </div>
    </div>
    
    <div className="flex items-center justify-center mt-4 pt-4 border-t border-blue-200">
      <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2" />
      <span className="text-sm text-blue-800 font-medium">You're ready to start training!</span>
    </div>
  </div>
);

// Example image component
const ExampleTrainingImage = ({ url, caption }: { url: string; caption: string }) => (
  <div className="w-full transition-transform duration-300 hover:scale-105">
    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <Image 
        src={url} 
        alt={caption} 
        fill 
        className="object-cover"
      />
    </div>
    <p className="text-xs text-gray-600 mt-1 text-center">{caption}</p>
  </div>
);

// Preset difficulty levels for training parameters
const PARAMETER_PRESETS = {
  beginner: {
    resolution: 512,
    num_train_epochs: 1,
    learning_rate: 1e-4,
  },
  standard: {
    resolution: 768,
    num_train_epochs: 2,
    learning_rate: 1e-4,
  },
  expert: {
    resolution: 1024,
    num_train_epochs: 4,
    learning_rate: 1e-4,
  }
};

export default function CreateModelPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ModelCreationFormData>({
    name: '',
    description: '',
    type: 'replicate',
    is_public: false,
    base_model_id: 'stability-ai/stable-diffusion-xl-base-1.0',
    parameters: {
      resolution: 512,
      train_batch_size: 1,
      num_train_epochs: 1,
      gradient_accumulation_steps: 4,
      learning_rate: 1e-4,
      lr_scheduler: 'constant',
      use_8bit_adam: true,
      xformers_attention: true,
      clip_skip: 2,
    }
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTrainingGuide, setShowTrainingGuide] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<'beginner' | 'standard' | 'expert'>('beginner');
  const [animateIn, setAnimateIn] = useState(false);
  
  useEffect(() => {
    // Trigger animations after initial render
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'application/zip': []
    },
    maxSize: 10 * 1024 * 1024, // 10MB max
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (parameters)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ModelCreationFormData] as Record<string, any>,
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : type === 'number' 
            ? Number(value) 
            : value
      }));
    }
  };

  // Apply parameter presets
  const applyPreset = (preset: 'beginner' | 'standard' | 'expert') => {
    setSelectedPreset(preset);
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters as Record<string, any>,
        ...PARAMETER_PRESETS[preset]
      }
    }));
  };

  // Calculate estimated time based on parameters
  const estimatedTrainingTime = () => {
    const { resolution = 512, num_train_epochs = 1 } = formData.parameters || {};
    const baseTime = 15; // Base time in minutes
    const resolutionFactor = resolution / 512;
    const epochFactor = num_train_epochs;
    
    const estimatedMinutes = Math.round(baseTime * resolutionFactor * epochFactor);
    return estimatedMinutes;
  };

  /**
   * Handle form submission to start model training
   */
  const handleSubmit = async () => {
    if (!formData.name || files.length === 0) {
      setError('Please provide a name and upload training images');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Create FormData for API request
      const apiFormData = new FormData();
      
      // Add form fields
      apiFormData.append('name', formData.name);
      if (formData.description) {
        apiFormData.append('description', formData.description);
      }
      apiFormData.append('is_public', formData.is_public.toString());
      apiFormData.append('base_model_id', formData.base_model_id || 'stability-ai/stable-diffusion-xl-base-1.0');
      apiFormData.append('parameters', JSON.stringify(formData.parameters || {}));
      
      // Add all training files
      files.forEach(file => {
        apiFormData.append('training_data', file);
      });
      
      // Call the API to start training
      const response = await fetch('/api/models/train', {
        method: 'POST',
        body: apiFormData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start model training');
      }
      
      // Success - show message and provide info
      setSuccess(`Model "${formData.name}" is now training. This will take approximately ${estimatedTrainingTime()} minutes.`);
      
      // Optionally, redirect to a status page or dashboard after a delay
      setTimeout(() => {
        router.push(ROUTES.models);
      }, 5000);
      
    } catch (err) {
      console.error('Error starting model training:', err);
      setError(err instanceof Error ? err.message : 'Failed to start model training');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div 
        className={`transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="gap-1 transition-all duration-300 hover:-translate-x-1"
          >
            <Link href={ROUTES.models}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Models
            </Link>
          </Button>
        </div>
        
        <div 
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 opacity-0 animate-slide-in"
          style={{
            animationDelay: '0.1s',
            animationFillMode: 'forwards'
          }}
        >
          <div>
            <h1 className="text-3xl font-bold">Create Custom Model</h1>
            <p className="text-gray-600 mt-1">Train your own AI model with your images</p>
          </div>
        </div>
        
        {showTrainingGuide && <TrainingTipsGuide onClose={() => setShowTrainingGuide(false)} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Model Information */}
            <div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 opacity-0 animate-fade-in"
              style={{
                animationDelay: '0.2s',
                animationFillMode: 'forwards'
              }}
            >
              <h2 className="text-xl font-semibold mb-4">Model Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tooltip content="This name will be used to identify your model in the dashboard">
                      Model Name
                    </Tooltip>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="My Custom Model"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tooltip content="A brief description of what your model is trained to generate">
                      Description (Optional)
                    </Tooltip>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="This model specializes in..."
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="is_public"
                    name="is_public"
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors duration-200"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                    <Tooltip content="Public models can be used by other users in your organization">
                      Make this model public
                    </Tooltip>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Training Data Upload */}
            <div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 opacity-0 animate-fade-in"
              style={{
                animationDelay: '0.3s',
                animationFillMode: 'forwards'
              }}
            >
              <h2 className="text-xl font-semibold mb-4">Training Data</h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-700">
                  Drag and drop your training images or zip file here, or{' '}
                  <span className="text-indigo-600 font-medium">browse</span> to select files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Preferred: ZIP file containing 10-20 images of your subject
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Alternatively: JPG, PNG, or WebP files up to 10MB each
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    {files.length} {files.length === 1 ? 'File' : 'Files'} Selected
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2">
                    {files.map((file, index) => (
                      <div key={index} className="relative group animate-fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                        <div className="aspect-square relative rounded overflow-hidden border border-gray-200">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Training image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            aria-label="Remove file"
                          >
                            <X className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Advanced Training Parameters */}
            <div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 opacity-0 animate-fade-in"
              style={{
                animationDelay: '0.4s',
                animationFillMode: 'forwards'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Training Parameters</h2>
                <div className="flex space-x-2">
                  {(['beginner', 'standard', 'expert'] as const).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-all duration-200 ${
                        selectedPreset === preset
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 mb-4 flex items-start">
                <Clock className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Estimated Training Time: {estimatedTrainingTime()} minutes</p>
                  <p className="text-xs text-amber-700 mt-1">Higher resolutions and more epochs increase training time but may improve results.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parameters.resolution" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tooltip content="Higher resolution produces more detailed images but takes longer to train">
                      Resolution
                    </Tooltip>
                  </label>
                  <select
                    id="parameters.resolution"
                    name="parameters.resolution"
                    value={formData.parameters?.resolution || 512}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value={512}>512 × 512 (Faster)</option>
                    <option value={768}>768 × 768 (Balanced)</option>
                    <option value={1024}>1024 × 1024 (Higher Quality)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="parameters.num_train_epochs" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tooltip content="More epochs mean more training iterations, which can improve quality but increase training time">
                      Training Epochs
                    </Tooltip>
                  </label>
                  <select
                    id="parameters.num_train_epochs"
                    name="parameters.num_train_epochs"
                    value={formData.parameters?.num_train_epochs || 1}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value={1}>1 Epoch (Faster)</option>
                    <option value={2}>2 Epochs (Balanced)</option>
                    <option value={4}>4 Epochs (Higher Quality)</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="font-medium text-gray-900">AI-Optimized Settings</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Additional parameters are automatically set to optimal values based on your selected preset.
                </p>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3 font-medium rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1"
                disabled={isLoading || files.length === 0 || !formData.name}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Training...
                  </>
                ) : (
                  'Start Model Training'
                )}
              </Button>
            
              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Training Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Training Started Successfully</p>
                    <p className="text-sm mt-1">{success}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div 
              className="sticky top-6 space-y-6 opacity-0 animate-fade-in"
              style={{
                animationDelay: '0.6s',
                animationFillMode: 'forwards'
              }}
            >
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Example Training Data</h3>
                <div className="grid grid-cols-2 gap-3">
                  <ExampleTrainingImage 
                    url="/training-examples/portrait-closeup.jpg" 
                    caption="Close-up portrait"
                  />
                  <ExampleTrainingImage 
                    url="/training-examples/full-body-woman.jpg" 
                    caption="Full body, natural pose"
                  />
                  <ExampleTrainingImage 
                    url="/training-examples/different-lighting.jpg" 
                    caption="Different lighting"
                  />
                  <ExampleTrainingImage 
                    url="/training-examples/woman-different-angle.jpg" 
                    caption="Different angle"
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-3">Training Tips</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-indigo-100 p-1 rounded-full mr-2 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-sm">Include 15-20 diverse images for best results</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 p-1 rounded-full mr-2 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-sm">Use consistent image quality and lighting</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 p-1 rounded-full mr-2 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-sm">For portraits, include various expressions and angles</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-indigo-100 p-1 rounded-full mr-2 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-sm">For products, show different sides and contexts</span>
                  </li>
                </ul>
              </div>
            </div>
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