import { useState, useCallback, useRef } from 'react';

type ProgressStatus = 'idle' | 'starting' | 'processing' | 'succeeded' | 'failed';

export interface Progress {
  id: string | null;
  status: ProgressStatus;
  progress: number;
  error: string | null;
  output: string | null;
}

interface UseGenerationProgressProps {
  modelName?: string;
  estimatedTime?: number;
}

interface UseGenerationProgressReturn {
  progress: Progress;
  processingTimeMs: number;
  estimatedTotalTimeMs: number;
  startGeneration: (id: string) => void;
  updateProgress: (progress: number) => void;
  completeGeneration: (output: string) => void;
  failGeneration: (error: string) => void;
  reset: () => void;
}

/**
 * Hook to track the progress of a generation task
 */
export function useGenerationProgress({
  modelName = 'AI',
  estimatedTime = 5000, // Default 5 seconds
}: UseGenerationProgressProps = {}): UseGenerationProgressReturn {
  const [progress, setProgress] = useState<Progress>({
    id: null,
    status: 'idle',
    progress: 0,
    error: null,
    output: null,
  });
  
  // Track timing for progress estimation
  const startTimeRef = useRef<number | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  
  // Update timer at regular intervals
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Start processing
  const startGeneration = useCallback((id: string) => {
    console.log(`Starting ${modelName} generation with ID: ${id}`);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset state
    setProgress({
      id,
      status: 'starting',
      progress: 0,
      error: null,
      output: null,
    });
    
    startTimeRef.current = Date.now();
    setProcessingTimeMs(0);
    
    // Start a timer to update the processing time
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        setProcessingTimeMs(elapsed);
        
        // Calculate progress based on elapsed time and estimated total time
        // Cap at 90% to leave room for completion
        const calculatedProgress = Math.min(0.9, elapsed / estimatedTime);
        
        setProgress(prev => ({
          ...prev,
          status: 'processing',
          progress: calculatedProgress,
        }));
      }
    }, 100); // Update every 100ms
    
  }, [modelName, estimatedTime]);
  
  // Update progress directly
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(prev => ({
      ...prev,
      status: 'processing',
      progress: Math.min(0.95, newProgress), // Cap at 95%
    }));
  }, []);
  
  // Complete generation
  const completeGeneration = useCallback((output: string) => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setProgress(prev => ({
      ...prev,
      status: 'succeeded',
      progress: 1,
      output,
    }));
    
    console.log(`${modelName} generation completed successfully!`);
  }, [modelName]);
  
  // Fail generation
  const failGeneration = useCallback((error: string) => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setProgress(prev => ({
      ...prev,
      status: 'failed',
      error,
    }));
    
    console.error(`${modelName} generation failed:`, error);
  }, [modelName]);
  
  // Reset progress
  const reset = useCallback(() => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setProgress({
      id: null,
      status: 'idle',
      progress: 0,
      error: null,
      output: null,
    });
    
    startTimeRef.current = null;
    setProcessingTimeMs(0);
  }, []);
  
  return {
    progress,
    processingTimeMs,
    estimatedTotalTimeMs: estimatedTime,
    startGeneration,
    updateProgress,
    completeGeneration,
    failGeneration,
    reset,
  };
} 