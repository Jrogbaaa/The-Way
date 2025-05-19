import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';

interface ModalTrainingRetryProps {
  modelId: string;
  errorMessage: string;
  onRetrySuccess?: () => void;
}

const ModalTrainingRetry = ({ modelId, errorMessage, onRetrySuccess }: ModalTrainingRetryProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle tensor type mismatch specifically
  const isTensorTypeError = errorMessage && 
    errorMessage.includes('torch.cuda.HalfTensor') && 
    errorMessage.includes('torch.HalfTensor');

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/modal/reset-training/${modelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset training');
      }
      
      // If successful, either call callback or redirect to create page
      if (onRetrySuccess) {
        onRetrySuccess();
      } else {
        router.push(`${ROUTES.models}?create=true`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset training');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Training Failed</AlertTitle>
        <AlertDescription>
          {isTensorTypeError ? (
            <>
              <p className="mb-2">Your model training failed due to a tensor type mismatch error.</p>
              <p className="text-sm">This is usually caused by hardware compatibility issues. Try again with fewer images.</p>
            </>
          ) : (
            <p>{errorMessage || 'An error occurred during model training.'}</p>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col space-y-3">
        <Button 
          onClick={handleRetry} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.push(ROUTES.models)}
          className="w-full"
        >
          Return to Models
        </Button>
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default ModalTrainingRetry; 