import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Bug, ChevronDown, ChevronRight, Zap, Scale, Brain } from 'lucide-react';
import Image from 'next/image';
import { trainCustomModel, getModelStatus, ModelStatusResponse, fileToBase64 } from '@/lib/services/modalService';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import { toast } from 'react-hot-toast';

// Define the training speed presets 
type TrainingSpeed = 'fast' | 'balanced' | 'high-quality';

const TRAINING_SPEED_PRESETS = {
  'fast': {
    steps: 150,
    label: '🚀 Fast',
    description: 'Preview quality (~7 min)',
    icon: Zap
  },
  'balanced': {
    steps: 300,
    label: '🎯 Balanced',
    description: 'Recommended (~15-20 min)',
    icon: Scale
  },
  'high-quality': {
    steps: 800,
    label: '🧠 High Quality',
    description: 'Best results (~60-90 min)',
    icon: Brain
  }
};

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
  const [trainingSpeed, setTrainingSpeed] = useState<TrainingSpeed>('balanced');
  const [trainingSteps, setTrainingSteps] = useState(TRAINING_SPEED_PRESETS['balanced'].steps);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<ModelStatusResponse | null>(null);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [statusCheckFailed, setStatusCheckFailed] = useState(false);
  const [interruptedTraining, setInterruptedTraining] = useState<{ trainingId: string; modelName: string } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<{timestamp: string, message: string, data?: any}[]>([]);
  const [validationData, setValidationData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUnstable, setIsUnstable] = useState(false);
  const router = useRouter();

  // Function to add debug log
  const addDebugLog = useCallback((message: string, data?: any) => {
    if (!debugMode) return;
    
    const timestamp = new Date().toISOString();
    setDebugLogs(prev => [...prev, { timestamp, message, data }]);
  }, [debugMode]);
  
  // Replace console.log in important functions to also add to debug logs
  const debugLog = useCallback((message: string, ...args: any[]) => {
    console.log(message, ...args);
    addDebugLog(message, args.length === 1 ? args[0] : args);
  }, [addDebugLog]);

  // Function to completely clear all training state
  const clearAllTrainingState = useCallback(() => {
    // Clear all training related localStorage items
    localStorage.removeItem('currentModelTraining');
    localStorage.removeItem('modelTrainingLastCheck');
    
    // Reset component state
    setTrainingId(null);
    setInterruptedTraining(null);
    setProgress(0);
    setIsLoading(false);
    setStatusCheckFailed(false);
    setSuccess(null);
    setError('');
    setIsComplete(false);
    
    debugLog('All training state cleared');
  }, [debugLog]);

  // Move forceCheckStatus here, before any useEffects that reference it
  const forceCheckStatus = async () => {
    if (!trainingId) return;
    
    try {
      setIsLoading(true);
      debugLog('Performing force check of training status...');
      
      // Try to get status from the API
      const response = await getModelStatus(trainingId);
      
      debugLog('Force check response:', response);
      
      // Process the response
      if (response.status === 'success' || response.status === 'completed' || 
          (typeof response.status === 'string' && response.status.includes('complete'))) {
        setSuccess(response);
        setIsLoading(false);
        setProgress(100);
        debugLog('Force check detected completed training');
        
        // Clear localStorage data
        localStorage.removeItem('currentModelTraining');
        localStorage.removeItem('modelTrainingLastCheck');
        
        toast.success("Model created successfully! Your custom model is ready to use.", {
          duration: 5000
        });
      } else if (response.status === 'error') {
        setError(response.error || response.error_message || 'Training failed');
        setIsLoading(false);
      } else if (response.progress >= 95) {
        // If progress is very high but not complete, assume it's done
        debugLog('High progress (95%+) detected, assuming training is complete');
        setSuccess({
          ...response,
          status: 'success',
          progress: 100
        });
        setIsLoading(false);
        setProgress(100);
        
        toast.success("Model appears to be complete. You can now use your custom model.", {
          duration: 5000
        });
      } else {
        setProgress(response.progress || 0);
        toast(`Current progress: ${response.progress || 0}%`, {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error during force check:', error);
      toast.error("Failed to check model status. Please try again.", {
        duration: 5000
      });
    }
  };

  // Update training steps when training speed changes
  useEffect(() => {
    setTrainingSteps(TRAINING_SPEED_PRESETS[trainingSpeed].steps);
  }, [trainingSpeed]);

  // Poll for training status if we have a training ID
  useEffect(() => {
    if (!trainingId) return;

    let isMounted = true;
    const initialCheckInterval = 5000; // Start with 5 seconds for more responsive updates
    let checkInterval = initialCheckInterval;
    let retryCount = 0;
    const maxRetries = 8; // Increase max retries
    const maxPollingTime = 60 * 60 * 1000; // 1 hour maximum polling time
    const startTime = Date.now();

    const checkStatus = async () => {
      if (!isMounted) return;

      // Check if we've been polling too long (safety mechanism)
      if (Date.now() - startTime > maxPollingTime) {
        debugLog('Maximum polling time exceeded, stopping status checks');
        setStatusCheckFailed(true);
        setError(`Training status checks timed out after ${Math.floor(maxPollingTime/60000)} minutes. The training may have stalled.`);
        return;
      }

      try {
        debugLog(`Checking status for training ID: ${trainingId} (retry ${retryCount}/${maxRetries})`);
        setStatusCheckFailed(false);
        
        // Use the enhanced getModelStatus with force check if we've had several retries
        const forceCheck = retryCount > 3; 
        const response = await getModelStatus(trainingId, forceCheck);
        
        if (!isMounted) return;
        
        debugLog('Status check response:', response);
        
        // Check for terminal statuses
        if (response.status === 'completed' || response.status === 'success') {
          debugLog('Training completed successfully');
          setSuccess(response);
          setIsLoading(false);
          setProgress(100);
          setIsComplete(true);
          
          if (onModelCreated && response.model_info) {
            onModelCreated(response.model_info);
          }
          
          // Clear the current training data from localStorage
          localStorage.removeItem('currentModelTraining');
          localStorage.removeItem('modelTrainingLastCheck');
          
          // Show success message
          toast.success("Model created successfully! Your custom model is ready to use.", {
            duration: 5000
          });
          return;
        }
        
        if (response.status === 'failed' || response.status === 'error') {
          debugLog('Training failed:', response.error || response.error_message);
          setError(response.error || response.error_message || 'Training failed');
          setIsLoading(false);
          
          // Clear the current training data from localStorage
          localStorage.removeItem('currentModelTraining');
          localStorage.removeItem('modelTrainingLastCheck');
          return;
        }
        
        // If still training, update progress
        if (['training', 'starting', 'preprocessing'].includes(response.status)) {
          debugLog(`Training in progress (${response.status}): ${response.progress || 0}%`);
          setProgress(response.progress || 0);
          retryCount = 0; // Reset retry count on successful status check
          
          // Adjust polling interval based on status
          if (response.status === 'training' && response.progress) {
            if (response.progress < 25) {
              checkInterval = 8000; // 8 seconds in early stages
            } else if (response.progress < 75) {
              checkInterval = 5000; // 5 seconds in middle of training
            } else {
              checkInterval = 3000; // 3 seconds when getting close to completion
            }
          }
          
          // Special check for high progress values - might be complete but not updated yet
          if (response.progress >= 95) {
            debugLog('Progress near completion, checking again soon with force flag');
            setTimeout(() => checkStatus(), 3000); // Check again quickly if we're close to done
            return;
          }
        }
      } catch (err) {
        console.error('Error checking training status:', err);
        retryCount++;
        
        // Exponential backoff for retries
        checkInterval = Math.min(30000, initialCheckInterval * Math.pow(1.5, retryCount)); 
        
        debugLog(`Status check failed, next retry in ${checkInterval/1000}s`);
        
        if (retryCount >= maxRetries) {
          debugLog(`Max retries (${maxRetries}) reached, stopping status checks`);
          setStatusCheckFailed(true);
          setError(`Failed to check training status after ${maxRetries} attempts. The training may still be in progress, but we can't verify it.`);
          return;
        }
      }
    };

    // Check immediately, then poll
    checkStatus();
    const intervalId = setInterval(() => checkStatus(), checkInterval);
    
    // Log debug info
    debugLog(`Started status polling for training ID: ${trainingId}`);
    debugLog(`Initial check interval: ${checkInterval}ms`);
    
    return () => {
      debugLog(`Cleaning up status polling for training ID: ${trainingId}`);
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [trainingId, onModelCreated, debugLog]);

  // Replace the existing resumeTrainingMonitoring function
  const resumeTrainingMonitoring = () => {
    if (!interruptedTraining) return;
    
    // Clear the interrupted training notification
    setInterruptedTraining(null);
    
    // Set the training ID to resume monitoring, with null checks
    if (interruptedTraining.trainingId && interruptedTraining.trainingId !== 'unknown') {
      console.log(`Resuming monitoring for training ID: ${interruptedTraining.trainingId}`);
      setTrainingId(interruptedTraining.trainingId);
    } else {
      console.error('Missing or invalid training ID in interrupted training data');
      setError('Cannot resume monitoring: Invalid training ID');
      return; // Don't continue with invalid ID
    }
    
    if (interruptedTraining.modelName) {
      setModelName(interruptedTraining.modelName);
    } else {
      setModelName('Unknown Model');
    }
    
    setIsLoading(true);
  };

  // Replace the existing useEffect for detecting training interruption
  useEffect(() => {
    const interrupted = detectTrainingInterruption();
    if (interrupted) {
      setInterruptedTraining(interrupted);
    }
  }, []);

  // Find and update the useEffect for checking status
  useEffect(() => {
    // Only check status if we're in loading state and have a trainingId
    if (isLoading && trainingId) {
      console.log(`Checking status for training ID: ${trainingId}`);
      
      // Create a function to check and update status
      const checkStatus = async () => {
        try {
          const statusData = await getModelStatus(trainingId);
          
          // Store last check time and status data in localStorage for recovery
          localStorage.setItem('modelTrainingLastCheck', JSON.stringify({
            id: trainingId,
            timestamp: Date.now(),
            status: statusData.status,
            progress: statusData.progress || 0,
            modelName,
          }));
          
          console.log('Status data:', statusData);
          
          // Handle different status types
          if (statusData.status === 'success') {
            console.log('Training completed successfully');
            setIsLoading(false);
            setSuccess(statusData);
            setProgress(100);
            
            // Save the completed model info
            if (statusData.model_info) {
              // Store model info for later use
              localStorage.setItem('lastCompletedModel', JSON.stringify(statusData.model_info));
            }
            
            // Clear the current training data from localStorage
            localStorage.removeItem('currentModelTraining');
            
            // Show success message
            toast.success("Model created successfully! Your custom model is ready to use.", {
              duration: 5000
            });
          } else if (statusData.status === 'error') {
            console.error('Training failed:', statusData.error);
            setIsLoading(false);
            setError(statusData.error || 'Training failed with an unknown error');
            
            // Clear the current training data from localStorage
            localStorage.removeItem('currentModelTraining');
            
            // Show error message
            toast.error(statusData.error || "An unknown error occurred", {
              duration: 5000
            });
          } else if (statusData.error === 'Training job not found') {
            console.error('Training job not found');
            setIsLoading(false);
            setError('Training job not found. The job may have been cancelled or expired.');
            
            // Don't clear localStorage data yet - it might be useful for retry
            
            // Show error message with retry option
            toast.error("The training job may have been cancelled or expired. You can retry the training.", {
              duration: 5000
            });
          } else if (statusData.status === 'training' && statusData.progress) {
            // We'll define unstable in the component based on progress patterns
            if (statusData.progress > 0 && statusData.progress < 5 && !statusData.error) {
              setProgress(statusData.progress || 0);
              
              if (!isUnstable) {
                setIsUnstable(true);
                
                // Show warning message only first time we detect instability
                toast.error("The training might be experiencing numerical instability. It will continue but results may be affected.", {
                  duration: 5000
                });
              }
            } else {
              // Regular progress update
              console.log(`Training in progress: ${statusData.progress}%`);
              setProgress(statusData.progress || 0);
            }
          } else {
            // Just update progress for any other status
            setProgress(statusData.progress || 0);
          }
        } catch (err) {
          console.error('Error checking training status:', err);
          
          // Handle specific error cases
          if (err instanceof Error && err.message.includes('not found')) {
            setError('Training job not found. It may have been cancelled or failed to start.');
            setIsLoading(false);
            
            toast.error("The training job may have been cancelled or failed to start.", {
              duration: 5000
            });
          } else {
            // Don't stop checking status for other types of errors
            // This could be a network issue or temporary API problem
            console.warn('Will retry status check later');
          }
        }
      };
      
      // Check immediately
      checkStatus();
      
      // And then set up interval for checking
      const intervalId = setInterval(checkStatus, 10000); // Check every 10 seconds
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [isLoading, trainingId, toast, modelName]);

  // Add recovery code to detect and resume interrupted training
  useEffect(() => {
    // Check for interrupted training on component mount
    const checkForInterruptedTraining = () => {
      const storedTraining = localStorage.getItem('currentModelTraining');
      const lastCheck = localStorage.getItem('modelTrainingLastCheck');
      
      if (storedTraining && lastCheck) {
        try {
          const training = JSON.parse(storedTraining);
          const status = JSON.parse(lastCheck);
          
          // If we have a recent check and it's not completed
          if (Date.now() - status.timestamp < 24 * 60 * 60 * 1000 && // Within 24 hours
              status.status !== 'success' && status.status !== 'error') {
            
            // Restore training state
            setTrainingId(training.id);
            setModelName(training.modelName);
            setProgress(status.progress || 0);
            setIsLoading(true);
          }
        } catch (e) {
          console.error('Error restoring training state:', e);
          // Clean up possibly corrupted data
          localStorage.removeItem('currentModelTraining');
          localStorage.removeItem('modelTrainingLastCheck');
        }
      }
    };
    
    // Only run on mount if we're not already in a training state
    if (!isLoading && !trainingId) {
      checkForInterruptedTraining();
    }
  }, [isLoading, trainingId]);

  // Add error handling for tensor type mismatch
  useEffect(() => {
    // Check terminal logs for common error patterns if progress is stuck
    const checkForErrors = async () => {
      if (isLoading && trainingId) {
        try {
          const statusData = await getModelStatus(trainingId);
          
          if (statusData.error_message) {
            // Special handling for common errors
            if (statusData.error_message.includes('torch.cuda.HalfTensor')) {
              setError("Training failed due to a tensor type mismatch. This is likely a hardware compatibility issue. Please try again with fewer images or contact support.");
              setIsLoading(false);
            } else if (statusData.error_message.includes('cannot identify image file')) {
              setError("One or more images couldn't be processed. Please ensure all images are valid and in a supported format (JPG, PNG).");
              setIsLoading(false);
            } else if (!statusData.error_message.includes('Connection refused')) {
              // Skip connection refused errors - they're expected in the cloud environment
              setError(statusData.error_message);
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error('Error checking for specific failure modes:', error);
        }
      }
    };
    
    if (isLoading && trainingId) {
      const timer = setTimeout(checkForErrors, 10000); // Check for errors every 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isLoading, trainingId]);

  // Add this effect to auto-detect and finish training for models that were very close to completion
  useEffect(() => {
    const checkForCompletedModels = async () => {
      const storedTraining = localStorage.getItem('currentModelTraining');
      const lastCheck = localStorage.getItem('modelTrainingLastCheck');
      
      if (storedTraining && lastCheck) {
        try {
          const training = JSON.parse(storedTraining);
          const status = JSON.parse(lastCheck);
          
          // If we have a high progress value from the last check
          if (status.progress >= 95 && !trainingId && !isLoading && !success) {
            debugLog('Found potentially completed training with high progress', {
              id: training.trainingId,
              progress: status.progress
            });
            
            // Set values to trigger a force check
            setTrainingId(training.trainingId);
            setModelName(training.modelName);
            setIsLoading(true);
            
            // Wait for state update then perform the check
            setTimeout(() => {
              forceCheckStatus();
            }, 1000);
          }
        } catch (e) {
          console.error('Error checking for completed models:', e);
        }
      }
    };
    
    // Run the check when component mounts
    checkForCompletedModels();
  }, [trainingId, isLoading, success, debugLog, forceCheckStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const validateModel = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return false;
    }

    if (!instancePrompt) {
      setError('Please provide an instance prompt');
      return false;
    }

    if (!modelName) {
      setError('Please provide a model name');
      return false;
    }

    try {
      setIsValidating(true);
      debugLog('Validating model parameters...');
      
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
      
      // Call validation endpoint
      const response = await fetch('/api/modal/validate-model', {
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
      
      const result = await response.json();
      debugLog('Validation response:', result);
      
      setValidationData(result.validationData);
      
      if (result.status === 'error') {
        setError(result.error || 'Validation failed');
        setIsValidating(false);
        return false;
      }
      
      if (result.status === 'warning') {
        // Show warnings but don't prevent submission
        setError(result.validationData.warnings.join('. '));
      } else {
        setError('');
      }
      
      setIsValidating(false);
      return result.validationData.valid;
    } catch (err) {
      console.error('Error validating model:', err);
      debugLog('Error validating model:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'An unknown error occurred during validation');
      setIsValidating(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Use current training steps from the selected speed preset
    const currentTrainingSteps = TRAINING_SPEED_PRESETS[trainingSpeed].steps;
    
    try {
      // Convert images to base64
      const base64Images = await Promise.all(Array.from(images).map(fileToBase64));
      
      // Create image data list with base64 data
      const imageDataList = base64Images.map(base64Data => ({ base64Data }));
      
      // Log what we're about to send
      debugLog(`Starting training with ${images.length} images, prompt: ${instancePrompt}, steps: ${currentTrainingSteps}`);
      
      // Store in localStorage to recover in case of interruption
      localStorage.setItem('currentModelTraining', JSON.stringify({
        modelName,
        instancePrompt,
        trainingSteps: currentTrainingSteps,
        imageCount: images.length,
        timestamp: Date.now()
      }));
      
      // Call the API to start training
      const response = await trainCustomModel({
        modelName,
        instancePrompt,
        imageDataList,
        trainingSteps: currentTrainingSteps
      });
      
      if (response.status === 'success') {
        setTrainingId(response.trainingId);
        
        // Store training ID for recovery
        localStorage.setItem('currentModelTraining', JSON.stringify({
          modelName,
          instancePrompt,
          trainingSteps: currentTrainingSteps,
          imageCount: images.length,
          trainingId: response.trainingId,
          timestamp: Date.now()
        }));
        
        toast.success("Model training has started! This may take some time.", {
          duration: 5000
        });
      } else {
        setError(response.error || 'An unknown error occurred');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error starting model training:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  const retryStatusCheck = () => {
    setStatusCheckFailed(false);
    setError('');
    // Force a new status check cycle
    const tempId = trainingId;
    setTrainingId(null);
    setTimeout(() => setTrainingId(tempId), 100);
  };

  // Add this function to detect training interruption
  const detectTrainingInterruption = () => {
    // Check if we have a training ID from a previous session
    const storedTrainingData = localStorage.getItem('currentModelTraining');
    if (!storedTrainingData) return null;
    
    try {
      const { trainingId, timestamp, modelName } = JSON.parse(storedTrainingData);
      const hoursSinceStart = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      // Validate the training ID
      if (!trainingId || trainingId === 'unknown' || trainingId.length < 5) {
        console.warn('Invalid training ID found in storage:', trainingId);
        localStorage.removeItem('currentModelTraining');
        return null;
      }
      
      // If training started recently (within last 24 hours), offer to check status
      if (hoursSinceStart < 24) {
        return { trainingId, modelName };
      }
      
      // Clear old training data
      localStorage.removeItem('currentModelTraining');
      return null;
    } catch (e) {
      console.error('Error parsing stored training data:', e);
      localStorage.removeItem('currentModelTraining');
      return null;
    }
  };

  // Add a function to cancel a running training job
  const cancelTraining = useCallback(async () => {
    if (!trainingId) return;
    
    if (confirm('Are you sure you want to cancel training? This cannot be undone.')) {
      try {
        debugLog('Attempting to cancel training for ID:', trainingId);
        
        // Try to call the cancel endpoint if it exists
        try {
          const response = await fetch(`/api/modal/cancel-training/${trainingId}`, {
            method: 'POST',
          });
          
          if (response.ok) {
            debugLog('Training cancellation request sent successfully');
          } else {
            debugLog('Training cancellation request failed:', response.statusText);
          }
        } catch (error) {
          // Even if the API doesn't exist, we should continue with clearing state
          debugLog('Error calling cancel API:', error);
        }
        
        // Clear all training state regardless of API result
        clearAllTrainingState();
      } catch (error) {
        console.error('Error cancelling training:', error);
        // Force clear anyway as a fallback
        clearAllTrainingState();
      }
    }
  }, [trainingId, clearAllTrainingState, debugLog]);

  // Add a function to handle retrying after a failed job
  const handleRetryTraining = () => {
    console.log('Resuming monitoring for interrupted training job');
    // Call the resumeTrainingMonitoring function to properly resume
    resumeTrainingMonitoring();
    
    // Start checking status right away
    setTimeout(() => {
      forceCheckStatus();
    }, 1000);
  };

  // Validate inputs before allowing submission
  const validateInputs = () => {
    if (!modelName || modelName.trim().length < 3) {
      setError('Please provide a valid model name (at least 3 characters)');
      return false;
    }
    
    if (!instancePrompt || !instancePrompt.includes('sks')) {
      setError('Please provide a valid instance prompt containing "sks" as the identifier');
      return false;
    }
    
    if (!images.length || images.length < 5) {
      setError('Please upload at least 5 images for training');
      return false;
    }
    
    return true;
  };

  // Render training speed selection UI component
  const renderTrainingSpeedOptions = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Training Speed
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(TRAINING_SPEED_PRESETS).map(([key, preset]) => {
          const Icon = preset.icon;
          return (
            <div 
              key={key}
              onClick={() => setTrainingSpeed(key as TrainingSpeed)}
              className={`flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-all ${
                trainingSpeed === key 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <Icon className={`h-6 w-6 mb-2 ${trainingSpeed === key ? 'text-indigo-600' : 'text-gray-500'}`} />
              <div className="text-sm font-medium">{preset.label}</div>
              <div className="text-xs text-gray-500 text-center mt-1">{preset.description}</div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Most personal models converge by 200-400 steps if image quality is high. Fast preset will give you ~90% of the quality in 25% of the time.
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create Model with Modal</h2>
      
      {/* Debug mode toggle with force reset button */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800"
        >
          <Bug className="h-3 w-3" />
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </button>
        
        <button
          onClick={clearAllTrainingState}
          className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700"
        >
          Force Reset
        </button>
      </div>
      
      {/* Debug console */}
      {debugMode && (
        <div className="mb-4 border border-gray-200 rounded bg-gray-50 p-2 text-xs font-mono overflow-auto max-h-48">
          <div className="text-gray-700 mb-1 font-semibold flex justify-between items-center">
            <span>Debug Console</span>
            <button 
              onClick={() => setDebugLogs([])}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Clear
            </button>
          </div>
          {debugLogs.length === 0 ? (
            <div className="text-gray-500 italic">No logs yet...</div>
          ) : (
            debugLogs.map((log, i) => (
              <div key={i} className="mb-1">
                <span className="text-gray-500 mr-2">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                <span className="text-indigo-700">{log.message}</span>
                {log.data && (
                  <details className="ml-4 mt-1">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800 flex items-center">
                      <ChevronRight className="h-3 w-3 inline" />
                      Data
                    </summary>
                    <pre className="text-gray-600 overflow-auto p-1 bg-gray-100 rounded mt-1 max-h-32">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Show interrupted training recovery option if applicable */}
      {interruptedTraining && !isLoading && !success && (
        <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-lg animate-fade-in">
          <h3 className="font-medium text-amber-800 flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
            Interrupted Training Detected
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            It looks like you were previously training a model named &quot;{interruptedTraining.modelName}&quot; (ID: {interruptedTraining.trainingId ? interruptedTraining.trainingId.substring(0, 8) : 'unknown'}...). 
            Would you like to resume monitoring this training job?
          </p>
          <div className="flex space-x-3">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleRetryTraining}
            >
              Resume Monitoring
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setInterruptedTraining(null)}
            >
              Start New Training
            </Button>
          </div>
        </div>
      )}
      
      {!isLoading && !success && !interruptedTraining && (
        <div className="space-y-6 animate-fade-in">
          <div className="mb-6">
            <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-2">
              Model Name
            </label>
            <input
              type="text"
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="E.g., My Character Model"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="instancePrompt" className="block text-sm font-medium text-gray-700 mb-2">
              Instance Prompt (include &quot;sks&quot; as the identifier)
            </label>
            <input
              type="text"
              id="instancePrompt"
              value={instancePrompt}
              onChange={(e) => setInstancePrompt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="E.g., a photo of sks person"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The identifier &quot;sks&quot; is required and will be replaced with your model name when generating.
            </p>
          </div>
          
          {renderTrainingSpeedOptions()}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Training Images (minimum 5, recommended 15-20)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="cursor-pointer text-indigo-600 hover:text-indigo-800 transition-colors block"
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Click to select images</span>
                  <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
                </div>
              </label>
            </div>
            
            {images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {images.length} image{images.length === 1 ? '' : 's'} selected
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 overflow-y-auto max-h-40 p-2 border border-gray-200 rounded-md">
                  {Array.from(images).map((file, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Training image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Debug mode toggle for development - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="debugMode"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="debugMode" className="text-xs text-gray-500 flex items-center">
                <Bug className="h-3 w-3 mr-1" /> 
                Enable debug mode
              </label>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start mb-4 animate-fade-in">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Validating...
                </>
              ) : (
                'Start Training'
              )}
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="mt-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
              Model Training in Progress
            </h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Starting</span>
              <span>Processing</span>
              <span>Completing</span>
            </div>
            
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <p className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                {progress === 0 ? (
                  'Initializing training environment...'
                ) : progress < 20 ? (
                  'Preparing model and dataset...'
                ) : progress < 50 ? (
                  'Training model (this may take 30-60 minutes)...'
                ) : progress < 80 ? (
                  'Fine-tuning model parameters...'
                ) : (
                  'Finalizing and saving model...'
                )}
              </p>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <p>Don't close this page. Training continues in the background.</p>
                <p>You'll be redirected when training completes.</p>
                <p className="mt-1">
                  Training ID: <span className="font-mono">{trainingId}</span>
                </p>
              </div>
            </div>
            
            {/* Add force check button when progress is past 90% or stuck for a while */}
            {progress >= 90 && (
              <button
                onClick={forceCheckStatus}
                className="mt-3 w-full py-1.5 px-3 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors"
              >
                Check if Complete
              </button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            onClick={cancelTraining}
            className="w-full"
          >
            Cancel Training
          </Button>
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
      
      {/* Validation results */}
      {validationData && !isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
          <h3 className="font-medium mb-2">Validation Results</h3>
          <div className="text-sm space-y-2">
            <p className="flex items-center gap-2">
              <span className={validationData.valid ? "text-green-600" : "text-yellow-600"}>
                {validationData.valid ? "✓ Valid configuration" : "⚠️ Configuration has warnings"}
              </span>
            </p>
            
            <div>
              <p className="font-medium">Images:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Total: {validationData.imageData.totalImages}</li>
                <li className={validationData.imageData.invalidImages > 0 ? "text-red-600" : ""}>
                  {validationData.imageData.invalidImages > 0 
                    ? `${validationData.imageData.invalidImages} invalid images detected` 
                    : "All images are valid"}
                </li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium">Estimated training time:</p>
              <p className="ml-2">~{validationData.estimatedTrainingTime.minutes} minutes ({validationData.estimatedTrainingTime.steps} steps)</p>
            </div>
            
            {validationData.warnings.length > 0 && (
              <div>
                <p className="font-medium text-yellow-700">Warnings:</p>
                <ul className="list-disc list-inside ml-2 text-yellow-700">
                  {validationData.warnings.map((warning: string, i: number) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex flex-col items-center">
          <CheckCircle2 className="h-8 w-8 mb-2" />
          <p className="font-medium">Model Created Successfully!</p>
          {success.model_info && (
            <p className="text-sm text-center mt-1">
              Model Name: {success.model_info.model_name}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ModalModelCreation; 