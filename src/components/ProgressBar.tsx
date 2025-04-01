import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GenerationStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

interface ProgressBarProps {
  status: GenerationStatus;
  progress: number;
  processingTimeMs?: number;
  estimatedTotalTimeMs?: number;
  modelName?: string;
  className?: string;
}

const statusMessages = {
  starting: 'Initializing model...',
  processing: 'Generating image...',
  succeeded: 'Generation complete!',
  failed: 'Generation failed',
  canceled: 'Generation canceled'
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  status,
  progress,
  processingTimeMs,
  estimatedTotalTimeMs,
  modelName = 'AI model',
  className
}) => {
  // Clamp progress between 0-100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  // Calculate the estimated time remaining
  const timeRemaining = estimatedTotalTimeMs && processingTimeMs
    ? Math.max(0, estimatedTotalTimeMs - processingTimeMs)
    : undefined;
    
  // Format time for display
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {(status === 'starting' || status === 'processing') && (
            <Loader2 className="w-4 h-4 mr-2 text-blue-500 animate-spin" />
          )}
          <span className="text-sm font-medium">
            {statusMessages[status]}
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          {status === 'processing' && timeRemaining !== undefined ? (
            `Est. ${formatTime(timeRemaining)} remaining`
          ) : (
            processingTimeMs !== undefined ? 
              `${formatTime(processingTimeMs)}` : 
              ''
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={cn(
            "h-2.5 rounded-full transition-all duration-300 ease-in-out",
            status === 'succeeded' ? 'bg-green-500' : 
            status === 'failed' ? 'bg-red-500' : 
            status === 'canceled' ? 'bg-gray-500' : 
            'bg-blue-500'
          )} 
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500">
        {modelName} • {Math.round(clampedProgress)}% complete
      </div>
    </div>
  );
};

export default ProgressBar; 