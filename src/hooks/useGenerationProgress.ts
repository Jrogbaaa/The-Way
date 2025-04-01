import { useState, useEffect } from 'react';
import { GenerationStatus } from '@/components/ProgressBar';

export interface GenerationProgress {
  status: GenerationStatus;
  progress: number;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  predictionId: string | null;
  imageUrl: string | null;
}

interface UseGenerationProgressOptions {
  modelName: string;
  pollInterval?: number;
  estimatedTime?: number; // in milliseconds
}

// Average completion times for different models (in milliseconds)
const MODEL_AVERAGE_TIMES: Record<string, number> = {
  'SDXL': 7000,      // ~7 seconds
  'Cristina': 15000, // ~15 seconds
  'Jaime': 15000,    // ~15 seconds
  'default': 10000   // Default estimate for unknown models
};

export const useGenerationProgress = (options: UseGenerationProgressOptions) => {
  const { 
    modelName, 
    pollInterval = 1000, 
    estimatedTime = MODEL_AVERAGE_TIMES[modelName] || MODEL_AVERAGE_TIMES.default
  } = options;
  
  const [progress, setProgress] = useState<GenerationProgress>({
    status: 'starting',
    progress: 0,
    startedAt: null,
    completedAt: null,
    error: null,
    predictionId: null,
    imageUrl: null
  });
  
  const [polling, setPolling] = useState(false);
  
  const startGeneration = (predictionId: string) => {
    const now = Date.now();
    setProgress({
      status: 'processing',
      progress: 5, // Start with a small progress so users see something happening
      startedAt: now,
      completedAt: null,
      error: null,
      predictionId,
      imageUrl: null
    });
    setPolling(true);
  };
  
  const completeGeneration = (imageUrl: string) => {
    const now = Date.now();
    setProgress(prev => ({
      ...prev,
      status: 'succeeded',
      progress: 100,
      completedAt: now,
      imageUrl
    }));
    setPolling(false);
  };
  
  const failGeneration = (error: string) => {
    const now = Date.now();
    setProgress(prev => ({
      ...prev,
      status: 'failed',
      error,
      completedAt: now
    }));
    setPolling(false);
  };
  
  const cancelGeneration = () => {
    const now = Date.now();
    setProgress(prev => ({
      ...prev,
      status: 'canceled',
      completedAt: now
    }));
    setPolling(false);
  };
  
  const reset = () => {
    setProgress({
      status: 'starting',
      progress: 0,
      startedAt: null,
      completedAt: null,
      error: null,
      predictionId: null,
      imageUrl: null
    });
    setPolling(false);
  };
  
  // Effect to simulate progress based on estimated time
  useEffect(() => {
    if (!polling || !progress.startedAt) return;
    
    // Calculate progress based on elapsed time and estimated total time
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - progress.startedAt!;
      
      // Calculate a progress value that accelerates at first then slows down
      // This simulates real model behavior better than linear progress
      const progressPercent = Math.min(95, Math.round((elapsed / estimatedTime) * 100));
      
      setProgress(prev => ({
        ...prev,
        progress: progressPercent
      }));
    };
    
    // Update progress immediately
    updateProgress();
    
    // Set up interval to update progress
    const intervalId = setInterval(updateProgress, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [polling, progress.startedAt, estimatedTime, pollInterval]);
  
  // Calculate current processing time if active
  const processingTimeMs = progress.startedAt 
    ? (progress.completedAt || Date.now()) - progress.startedAt
    : undefined;
  
  return {
    progress,
    processingTimeMs,
    estimatedTotalTimeMs: estimatedTime,
    startGeneration,
    completeGeneration,
    failGeneration,
    cancelGeneration,
    reset
  };
}; 