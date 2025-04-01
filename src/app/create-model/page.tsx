'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Sparkles, Save, Upload, AlertCircle, Info, Server, Database, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import Link from 'next/link';

// Define form data interface for type safety
interface FormData {
  name: string;
  description: string;
  category: string;
  useCase: string;
  trainingData: File | null;
  configuration: {
    epochs: number;
    learningRate: number;
    batchSize: number;
  };
}

export default function CreateModelPage() {
  const [step, setStep] = useState(1);
  const [animateIn, setAnimateIn] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    useCase: '',
    trainingData: null,
    configuration: {
      epochs: 3,
      learningRate: 0.001,
      batchSize: 4
    }
  });
  
  // Progress steps
  const steps = [
    { id: 1, title: 'Model Info' },
    { id: 2, title: 'Training Data' },
    { id: 3, title: 'Configuration' },
    { id: 4, title: 'Review' }
  ];
  
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
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., configuration.epochs)
      const [parent, child] = name.split('.');
      
      if (parent === 'configuration') {
        setFormData(prev => ({
          ...prev,
          configuration: {
            ...prev.configuration,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      trainingData: file
    }));
  };
  
  // Navigate to next step
  const handleNext = () => {
    if (step < steps.length) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Navigate to previous step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Check if the current step's required fields are filled
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.description && formData.category;
      case 2:
        return formData.trainingData;
      case 3:
        return true; // Configuration has default values
      default:
        return true;
    }
  };
  
  return (
    <MainLayout>
      <div className={`transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header section */}
        <div 
          className="mb-8 opacity-0 animate-slide-in"
          style={{
            animationDelay: '0.1s',
            animationFillMode: 'forwards'
          }}
        >
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-indigo-600" />
            Create Custom AI Model
          </h1>
          <p className="text-gray-600 mt-1">Train a new AI model tailored to your specific needs</p>
        </div>
        
        {/* AI Tip */}
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
                <Lightbulb className="h-5 w-5 text-indigo-600" />
              </div>
              
              <div className="ml-3">
                <h3 className="text-sm font-medium text-indigo-800">AI Training Tip</h3>
                <p className="mt-1 text-sm text-indigo-700">
                  For best results, provide at least 10-20 examples of the content you want your model to create.
                  The more diverse and high-quality your training data, the more versatile your model will be.
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
        
        {/* Progress Steps */}
        <div 
          className="mb-8 opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.3s',
            animationFillMode: 'forwards'
          }}
        >
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step > s.id 
                      ? 'bg-green-100 text-green-600' 
                      : step === s.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-500'
                  } transition-all duration-300`}
                >
                  {step > s.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span>{s.id}</span>
                  )}
                </div>
                
                <div className="flex flex-col ml-3">
                  <span className={`text-sm font-medium ${
                    step === s.id ? 'text-indigo-600' : 'text-gray-700'
                  }`}>
                    {s.title}
                  </span>
                </div>
                
                {i < steps.length - 1 && (
                  <div 
                    className={`w-12 h-1 mx-2 ${step > s.id ? 'bg-indigo-600' : 'bg-gray-200'} transition-all duration-500`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div 
          className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.4s',
            animationFillMode: 'forwards'
          }}
        >
          {/* Step 1: Model Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Info className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3">Model Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Model Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Content Creator Pro"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what your model will do..."
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow duration-200"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Content">Content Creation</option>
                    <option value="Image">Image Generation</option>
                    <option value="Conversation">Conversational</option>
                    <option value="Analysis">Data Analysis</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Use Case
                  </label>
                  <input
                    id="useCase"
                    name="useCase"
                    type="text"
                    value={formData.useCase}
                    onChange={handleChange}
                    placeholder="e.g., Writing social media posts"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow duration-200"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Training Data */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Database className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3">Training Data</h2>
              </div>
              
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-indigo-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Upload Training Data</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload .csv, .txt, or .zip files containing your training examples
                    </p>
                  </div>
                  
                  <div>
                    <label className="inline-block">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".csv,.txt,.zip"
                      />
                      <Button
                        variant="outline"
                        className="bg-white hover:bg-indigo-50 transition-all duration-300"
                        type="button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </label>
                  </div>
                  
                  {formData.trainingData && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span>
                        File selected: {(formData.trainingData as File).name} 
                        ({Math.round((formData.trainingData as File).size / 1024)} KB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Training Data Requirements</h3>
                  <ul className="mt-1 text-xs text-amber-700 list-disc pl-4 space-y-1">
                    <li>Each example should be clearly labeled</li>
                    <li>Minimum 10 examples recommended, 20+ for best results</li>
                    <li>Maximum file size: 100MB</li>
                    <li>Content should be relevant to your model's purpose</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Server className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3">Model Configuration</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Epochs
                    <Tooltip content="Number of complete passes through the training dataset">
                      <Info className="h-4 w-4 text-gray-400 inline ml-1" />
                    </Tooltip>
                  </label>
                  <input
                    type="range"
                    name="configuration.epochs"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.configuration.epochs}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Faster (1)</span>
                    <span className="font-medium text-indigo-600">{formData.configuration.epochs}</span>
                    <span>Better (5)</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Rate
                    <Tooltip content="Controls how quickly the model adapts to the problem">
                      <Info className="h-4 w-4 text-gray-400 inline ml-1" />
                    </Tooltip>
                  </label>
                  <select
                    name="configuration.learningRate"
                    value={formData.configuration.learningRate}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow duration-200"
                  >
                    <option value="0.0001">Low (0.0001) - More Stable</option>
                    <option value="0.001">Medium (0.001) - Balanced</option>
                    <option value="0.01">High (0.01) - Faster Learning</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Size
                    <Tooltip content="Number of training examples utilized in one iteration">
                      <Info className="h-4 w-4 text-gray-400 inline ml-1" />
                    </Tooltip>
                  </label>
                  <select
                    name="configuration.batchSize"
                    value={formData.configuration.batchSize}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow duration-200"
                  >
                    <option value="2">Small (2) - Less Memory</option>
                    <option value="4">Medium (4) - Balanced</option>
                    <option value="8">Large (8) - Better Performance</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">Advanced Configuration</h3>
                <p className="text-xs text-indigo-700">
                  These settings are optimized for most use cases. Advanced users can fine-tune parameters 
                  for specific needs. Default values work well for most models.
                </p>
              </div>
            </div>
          )}
          
          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3">Review & Create</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-3">Model Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name:</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Category:</p>
                      <p className="font-medium">{formData.category}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-500">Description:</p>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                    {formData.useCase && (
                      <div className="md:col-span-2">
                        <p className="text-gray-500">Use Case:</p>
                        <p className="font-medium">{formData.useCase}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-3">Training Data</h3>
                  <div className="flex items-center">
                    <Upload className="h-5 w-5 text-indigo-600 mr-2" />
                    <p className="text-sm font-medium">
                      {formData.trainingData 
                        ? (formData.trainingData as File).name 
                        : 'No file selected'}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-3">Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Epochs:</p>
                      <p className="font-medium">{formData.configuration.epochs}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Learning Rate:</p>
                      <p className="font-medium">{formData.configuration.learningRate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Batch Size:</p>
                      <p className="font-medium">{formData.configuration.batchSize}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Ready to Create</h3>
                  <p className="text-xs text-green-700">
                    Your model is ready to be created. Training will begin once you submit and
                    may take 30-60 minutes depending on the complexity and data size.
                    You'll receive a notification when training is complete.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="transition-all duration-300 hover:-translate-x-1"
              >
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            {step < steps.length ? (
              <Button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 hover:translate-x-1 ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Link href="/models">
                <Button 
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 hover:translate-x-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Model
                </Button>
              </Link>
            )}
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