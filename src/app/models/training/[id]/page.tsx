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
              onClick={() => router.push(ROUTES.createModel)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try Again with Different Settings
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Training Progress</h2>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-1 text-amber-500" />
                <span>
                  Estimated time remaining: ~{getRemainingTime()} minutes
                </span>
              </div>
            </div>
            
            <div className="space-y-8">
              {stages.map((stage, index) => (
                <TrainingStage
                  key={index}
                  title={stage.title}
                  description={stage.description}
                  stage={index + 1}
                  currentStage={currentStage}
                />
              ))}
              
              {/* Final Stage - Completed */}
              {currentStage === 5 && (
                <div className="flex items-start">
                  <div className="mr-4 flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800">Training Complete!</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Your model is ready to use. Redirecting to models page...
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Overall progress bar */}
            <div className="mt-8">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.min(100, Math.round((currentStage - 1) * 25))}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, (currentStage - 1) * 25)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Training Tips</h2>
              <CircleHelp className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">While You Wait</h3>
              <ul className="text-xs text-blue-700 space-y-2">
                {getTrainingTips(currentStage).map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Training Details</h3>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Model ID:</dt>
                  <dd className="font-mono text-gray-900">{id.substring(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status:</dt>
                  <dd className="font-medium">
                    {status === 'succeeded' && <span className="text-green-600">Completed</span>}
                    {status === 'processing' && <span className="text-blue-600">Processing</span>}
                    {status === 'failed' && <span className="text-red-600">Failed</span>}
                    {status === 'canceled' && <span className="text-gray-600">Canceled</span>}
                  </dd>
                </div>
                {modelData?.created_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Started:</dt>
                    <dd className="text-gray-900">
                      {new Date(modelData.created_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                You can close this page and return later. Your model will continue training and will be available in your Models dashboard when complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 