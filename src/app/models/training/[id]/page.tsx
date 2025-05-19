'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleHelp, Loader2, AlertTriangle, CheckCircle2, ChevronLeft, Clock } from 'lucide-react';
import { ROUTES } from '@/lib/config';
import { checkTrainingStatus } from '@/lib/api/replicateModels';

// Training stage component with progress indicator
const TrainingStage = ({ 
  title, 
  description, 
  stage, 
  currentStage 
}: { 
  title: string; 
  description: string; 
  stage: number; 
  currentStage: number;
}) => {
  // Calculate status based on current stage
  let status: 'pending' | 'active' | 'completed' = 'pending';
  if (stage < currentStage) {
    status = 'completed';
  } else if (stage === currentStage) {
    status = 'active';
  }
  
  return (
    <div className="flex items-start">
      <div className="mr-4 flex-shrink-0">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
          status === 'completed' ? 'bg-green-100' :
          status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {status === 'active' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
          {status === 'pending' && <span className="text-gray-500 font-medium">{stage}</span>}
        </div>
      </div>
      <div className="flex-1">
        <h3 className={`text-sm font-medium ${
          status === 'completed' ? 'text-green-800' :
          status === 'active' ? 'text-blue-800' : 'text-gray-500'
        }`}>{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};

// Training tips by stage
const getTrainingTips = (stage: number) => {
  switch(stage) {
    case 1:
      return [
        "Your images are being processed and prepared for training",
        "This typically takes 2-3 minutes",
        "We're analyzing your images to determine the best learning approach"
      ];
    case 2:
      return [
        "The model is now learning from your images",
        "This is the longest part of the process (20-45 minutes)",
        "The more epochs you selected, the longer this will take"
      ];
    case 3:
      return [
        "Your model is being refined and optimized",
        "The system is improving detail recognition and accuracy",
        "Almost there! Just a few more minutes"
      ];
    case 4:
      return [
        "Final touches are being applied to your model",
        "The model is being saved and prepared for inference",
        "You'll be able to generate images soon"
      ];
    default:
      return [
        "Your model is being prepared",
        "This process takes approximately 30-60 minutes total",
        "Please be patient while we train your custom model"
      ];
  }
};

// Use proper type for params in Next.js 15
type TrainingPageParams = {
  params: {
    id: string;
  };
};

export default function TrainingStatusPage({ params }: TrainingPageParams) {
  const router = useRouter();
  const { id } = params;
  
  const [status, setStatus] = useState<string>('processing');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modelData, setModelData] = useState<any>(null);
  const [pollingCount, setPollingCount] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<number>(1);
  
  // Calculate estimated remaining time
  const getRemainingTime = () => {
    // Base time is 30 minutes
    const baseMinutes = 30;
    
    // Each stage is roughly 25% of the total time
    const stagePercentage = 0.25;
    
    // Calculate remaining percentage
    const completedStages = currentStage - 1;  
    const completedPercentage = completedStages * stagePercentage;
    
    // Calculate remaining time in minutes
    const remainingMinutes = Math.round(baseMinutes * (1 - completedPercentage));
    
    return remainingMinutes;
  };
  
  // Poll for status updates
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const result = await checkTrainingStatus(id);
        
        setStatus(result.status);
        setModelData(result);
        
        // Determine current stage based on status and polling count
        if (result.status === 'succeeded') {
          setCurrentStage(5); // Completed
        } else if (result.status === 'failed') {
          setError('Training failed: ' + (result.error || 'Unknown error'));
        } else {
          // Simulate progression through stages based on polling count
          // In a real implementation, you'd use actual progress from the API
          const newStage = Math.min(4, Math.floor(pollingCount / 5) + 1);
          setCurrentStage(newStage);
        }
        
        setLoading(false);
        
        // If completed, redirect to models page after delay
        if (result.status === 'succeeded') {
          setTimeout(() => {
            router.push(ROUTES.models);
          }, 5000);
        }
        
      } catch (err) {
        console.error('Error checking training status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check training status');
        setLoading(false);
      }
    };
    
    fetchStatus();
    
    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchStatus();
      setPollingCount(prev => prev + 1);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [id, pollingCount, router]);
  
  // Training stages
  const stages = [
    {
      title: 'Preparing Training Data',
      description: 'Uploading and processing your images',
    },
    {
      title: 'Training Model',
      description: 'Learning patterns from your images',
    },
    {
      title: 'Fine-tuning',
      description: 'Optimizing model weights and performance',
    },
    {
      title: 'Finalizing',
      description: 'Saving model and preparing for deployment',
    },
  ];
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button 
          onClick={() => router.push(ROUTES.models)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Models
        </button>
        <h1 className="text-3xl font-bold">Model Training Status</h1>
        <p className="text-gray-600 mt-2">
          Your custom LoRA model is being trained. This process typically takes 30-60 minutes.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Training Error</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => router.push(ROUTES.models)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try Again with Different Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Progress Tracker Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Progress Header with Status */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Training Progress</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium 
              ${status === 'succeeded' ? 'bg-green-100 text-green-800' : 
               status === 'failed' ? 'bg-red-100 text-red-800' : 
               'bg-blue-100 text-blue-800'}`}>
              {status === 'succeeded' ? 'Completed' : 
               status === 'failed' ? 'Failed' : 
               status === 'training' ? 'In Progress' : 'Initializing'}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    {modelData?.progress ? `${modelData.progress}%` : 'Starting...'}
                  </span>
                </div>
                {modelData?.progress && modelData.progress > 0 && modelData.progress < 100 && (
                  <div className="text-xs text-gray-500">
                    Est. time remaining: ~{Math.ceil((100 - (modelData.progress || 0)) / 4)} minutes
                  </div>
                )}
              </div>
              <div className="overflow-hidden h-2 mt-2 text-xs flex rounded bg-indigo-100">
                <div style={{ width: `${modelData?.progress || 0}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500">
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Stages */}
        <div className="px-6 py-5">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Training Stages</h4>
          
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-start">
                <div className={`rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5
                  ${index < currentStage ? 'bg-green-100 text-green-600' : 
                  index === currentStage ? 'bg-blue-100 text-blue-600' : 
                  'bg-gray-100 text-gray-400'}`}>
                  {index < currentStage ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3">
                  <h5 className={`text-sm font-medium ${
                    index < currentStage ? 'text-green-600' : 
                    index === currentStage ? 'text-blue-600' : 
                    'text-gray-500'}`}>
                    {stage.title}
                    {index === currentStage && <span className="ml-2 animate-pulse">•••</span>}
                  </h5>
                  <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
                </div>
              </div>
            ))}
            
            {status === 'succeeded' && (
              <div className="flex items-start">
                <div className="rounded-full h-6 w-6 bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-green-600">Completed Successfully</h5>
                  <p className="text-xs text-gray-500 mt-0.5">Your model is ready to use</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <p>You can safely close this page. The training will continue in the background.</p>
            {status !== 'succeeded' && status !== 'failed' && (
              <p className="mt-1">Check back later to see your completed model!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 