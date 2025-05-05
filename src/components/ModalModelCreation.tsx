import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { trainCustomModel, getModelTrainingStatus, ModelTrainingResponse } from '@/lib/services/modalService';

interface ModalModelCreationProps {
  onModelCreated?: (modelInfo: any) => void;
  onClose: () => void;
}

const ModalModelCreation: React.FC<ModalModelCreationProps> = ({
  onModelCreated,
  onClose,
}) => {
  const [images, setImages] = useState<File[]>([]);
  const [instancePrompt, setInstancePrompt] = useState('');
  const [modelName, setModelName] = useState('');
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<ModelTrainingResponse | null>(null);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [statusCheckFailed, setStatusCheckFailed] = useState(false);

  // Poll for training status if we have a training ID
  useEffect(() => {
    if (!trainingId) return;

    let isMounted = true;
    const checkInterval = 10000; // 10 seconds
    let retryCount = 0;
    const maxRetries = 3;

    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        console.log(`Checking status for training ID: ${trainingId}`);
        setStatusCheckFailed(false);
        const response = await getModelTrainingStatus(trainingId);
        
        if (!isMounted) return;
        
        if (response.status === 'success') {
          console.log('Training completed successfully');
          setSuccess(response);
          setIsLoading(false);
          if (onModelCreated && response.modelInfo) {
            onModelCreated(response.modelInfo);
          }
          return;
        }
        
        if (response.status === 'error') {
          console.error('Training failed:', response.error);
          setError(response.error || 'Training failed');
          setIsLoading(false);
          return;
        }
        
        // If still training, update progress
        if (response.status === 'training') {
          console.log(`Training in progress: ${response.progress || 0}%`);
          setProgress(response.progress || 0);
          retryCount = 0; // Reset retry count on successful status check
        }
      } catch (err) {
        console.error('Error checking training status:', err);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.log(`Max retries (${maxRetries}) reached, stopping status checks`);
          setStatusCheckFailed(true);
          setError(`Failed to check training status after ${maxRetries} attempts. The training may still be in progress, but we can't verify it.`);
          return;
        }
      }
    };

    // Check immediately, then poll
    checkStatus();
    const interval = setInterval(checkStatus, checkInterval);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [trainingId, onModelCreated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (!instancePrompt) {
      setError('Please provide an instance prompt');
      return;
    }

    if (!modelName) {
      setError('Please provide a model name');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatusCheckFailed(false);

    try {
      console.log('Preparing images for upload...');
      
      // Prepare image data
      const imageDataList = await Promise.all(
        images.map(async (image) => {
          const base64Data = await fileToBase64(image);
          return {
            base64Data,
            name: image.name,
            type: image.type,
          };
        })
      );
      
      console.log('Submitting model creation request...');
      
      // Call the API endpoint
      const response = await fetch('/api/model/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataList,
          instancePrompt,
          modelName,
          trainingSteps,
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || `Server error: ${response.status}` };
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response data:', result);

      if (result.status === 'success') {
        setTrainingId(result.trainingId);
        console.log('Training started with ID:', result.trainingId);
      } else {
        setError(result.error || 'Failed to start training');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error in model creation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const retryStatusCheck = () => {
    setStatusCheckFailed(false);
    setError('');
    // Force a new status check cycle
    const tempId = trainingId;
    setTrainingId(null);
    setTimeout(() => setTrainingId(tempId), 100);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create Model with Modal</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-1">
            Model Name
          </label>
          <input
            id="modelName"
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="My Custom Model"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="instancePrompt" className="block text-sm font-medium text-gray-700 mb-1">
            Instance Prompt
          </label>
          <input
            id="instancePrompt"
            type="text"
            value={instancePrompt}
            onChange={(e) => setInstancePrompt(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="photo of sks person"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Use "sks" as a unique identifier for your subject
          </p>
        </div>
        
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
            Training Images
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload 5-10 high-quality images of the subject
          </p>
        </div>
        
        <div>
          <label htmlFor="trainingSteps" className="block text-sm font-medium text-gray-700 mb-1">
            Training Steps: {trainingSteps}
          </label>
          <input
            id="trainingSteps"
            type="range"
            min="500"
            max="2000"
            step="100"
            value={trainingSteps}
            onChange={(e) => setTrainingSteps(Number(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Faster (500)</span>
            <span>Better Quality (2000)</span>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {progress > 0 ? `Training: ${progress}% complete` : 'Starting training...'}
          </p>
        </div>
      )}
      
      {statusCheckFailed && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Status check failed</p>
            <p className="text-sm">We're having trouble checking the status of your model training. The training might still be in progress.</p>
            <button
              onClick={retryStatusCheck}
              className="mt-2 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-md text-yellow-800 transition-colors"
            >
              Retry Status Check
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex flex-col items-center">
          <CheckCircle2 className="h-8 w-8 mb-2" />
          <p className="font-medium">Model Created Successfully!</p>
          {success.modelInfo && (
            <p className="text-sm text-center mt-1">
              Model Name: {success.modelInfo.model_name}
            </p>
          )}
          {success.sampleImageBase64 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Sample Output:</p>
              <Image
                src={`data:image/png;base64,${success.sampleImageBase64}`}
                alt="Sample output from model"
                width={200}
                height={200}
                className="rounded-md border border-gray-300"
              />
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading && !error}
        >
          Cancel
        </button>
        
        {!success && !trainingId && (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !modelName || !instancePrompt || images.length === 0}
            className="px-4 py-2 bg-indigo-600 rounded-md text-white hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Processing...
              </span>
            ) : (
              'Create Model'
            )}
          </button>
        )}
        
        {success && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 rounded-md text-white hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default ModalModelCreation; 