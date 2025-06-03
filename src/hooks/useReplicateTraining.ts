import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface TrainingConfig {
  modelName: string;
  instancePrompt: string;
  trainingImagesZipUrl: string;
  triggerWord: string;
  tempId?: string; // For configurations stored for unauthenticated users
}

interface TrainingStatus {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  progress: number;
  error?: string;
  modelVersion?: string;
  logs?: string;
  replicateId?: string;
  progressStage?: string;
  estimatedTimeRemaining?: number;
}

export const useReplicateTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempConfigId, setTempConfigId] = useState<string | null>(null);

  // Store training configuration for unauthenticated users
  const storeConfigForLater = useCallback(async (config: Omit<TrainingConfig, 'tempId'>) => {
    try {
      console.log('Storing training configuration for later authentication:', config);
      
      const response = await fetch('/api/training/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to store configuration');
      }

      const result = await response.json();
      
      if (result.success) {
        setTempConfigId(result.tempId);
        console.log('Configuration stored with temp ID:', result.tempId);
        return result.tempId;
      } else {
        throw new Error(result.error || 'Failed to store configuration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error storing configuration:', errorMessage);
      throw err;
    }
  }, []);

  // Start a new training (either directly or with stored config)
  const startTraining = useCallback(async (config: TrainingConfig) => {
    try {
      setIsTraining(true);
      setError(null);
      
      console.log('Starting Replicate training with config:', config);
      
      const requestBody: any = {
        modelName: config.modelName,
        instancePrompt: config.instancePrompt,
        trainingImagesZipUrl: config.trainingImagesZipUrl,
        triggerWord: config.triggerWord
      };

      // If we have a tempId (from stored config), include it
      if (config.tempId) {
        requestBody.tempId = config.tempId;
      }
      
      console.log('Sending training request with body:', requestBody);
      
      const response = await fetch('/api/replicate/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Training API response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to start training';
        try {
        const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Training API error data:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Training API success result:', result);
      
      if (result.success) {
        setTrainingId(result.trainingId);
        setStatus({
          id: result.trainingId,
          status: result.status,
          progress: 0
        });
        
        // Clear temp config ID after successful training start
        setTempConfigId(null);
        
        toast.success('Training started successfully!');
        return result.trainingId;
      } else {
        throw new Error(result.error || 'Training failed to start');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Training error details:', err);
      setError(errorMessage);
      setIsTraining(false);
      toast.error(`Training failed: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Check training status
  const checkStatus = useCallback(async (id: string) => {
    try {
      // Use the training-logs endpoint for real-time progress
      const response = await fetch(`/api/replicate/training-logs/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check status');
      }

      const statusData = await response.json();
      
      // Update the status with enhanced training data
      setStatus({
        id: statusData.id,
        status: statusData.status,
        progress: statusData.progress,
        error: statusData.error,
        modelVersion: statusData.modelUrl,
        logs: statusData.logs,
        replicateId: statusData.replicateId,
        progressStage: statusData.stage,
        estimatedTimeRemaining: statusData.estimatedTimeRemaining
      });

      // If training completed or failed, stop the training state
      if (statusData.status === 'succeeded' || statusData.status === 'failed') {
        setIsTraining(false);
        
        if (statusData.status === 'succeeded') {
          toast.success('Training completed successfully!');
        } else if (statusData.status === 'failed') {
          setError(statusData.error || 'Training failed');
          toast.error('Training failed');
        }
      }

      return statusData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMessage);
      console.error('Error checking training status:', err);
      throw err;
    }
  }, []);

  // Auto-poll status when training is active
  useEffect(() => {
    if (!trainingId || !isTraining) return;

    const pollInterval = setInterval(async () => {
      try {
        await checkStatus(trainingId);
      } catch (err) {
        console.error('Status polling failed:', err);
        // Don't stop polling on single failures, just log them
      }
    }, 5000); // Poll every 5 seconds for more responsive progress updates

    return () => clearInterval(pollInterval);
  }, [trainingId, isTraining, checkStatus]);

  // Reset state
  const reset = useCallback(() => {
    setIsTraining(false);
    setTrainingId(null);
    setStatus(null);
    setError(null);
    setTempConfigId(null);
  }, []);

  return {
    // State
    isTraining,
    trainingId,
    status,
    error,
    tempConfigId,
    
    // Actions
    startTraining,
    checkStatus,
    reset,
    storeConfigForLater,
    
    // Computed
    isCompleted: status?.status === 'succeeded',
    isFailed: status?.status === 'failed',
    progress: status?.progress || 0,
    modelVersion: status?.modelVersion
  };
}; 