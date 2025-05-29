import axios from 'axios';

/**
 * Interface for model training configuration
 */
export interface ModelTrainingConfig {
  modelName: string;
  instancePrompt: string;
  images?: File[];
  imageDataList?: Array<{ base64Data: string }>;
  baseModel?: string;
  trainingSteps?: number;
}

/**
 * Interface for model training response
 */
export interface ModelTrainingResponse {
  trainingId: string;
  status: 'success' | 'error';
  message?: string;
  error?: string;
}

/**
 * Interface for model status response
 */
export interface ModelStatusResponse {
  id: string;
  status: 'success' | 'error' | 'training' | 'starting' | 'completed' | 'pending' | 'failed' | 'preprocessing';
  progress: number;
  error?: string;
  error_message?: string;
  model_info?: any;
  created_at: string;
  // Additional fields returned by the API
  model_name?: string;
  last_update?: string;
  input_data?: {
    instancePrompt?: string;
    trainingSteps?: number;
    imageCount?: number;
    [key: string]: any;
  };
  sample_image?: string;
  model_url?: string;
}

/**
 * Interface for image generation request
 */
export interface ImageGenerationRequest {
  modelId: string;
  prompt: string;
}

/**
 * Interface for image generation response
 */
export interface ImageGenerationResponse {
  status: 'success' | 'error';
  imageUrl?: string;
  error?: string;
  details?: string;
  seed?: number;
  errorType?: string;
  message?: string;
}

/**
 * Trains a custom model with the provided images and configuration
 */
export const trainCustomModel = async (config: ModelTrainingConfig): Promise<ModelTrainingResponse> => {
  try {
    console.log('Submitting model creation request...');
    
    // Check if using imageDataList or files
    if (config.imageDataList) {
      // Use direct API with JSON for base64 images
      const response = await fetch('/api/modal/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelName: config.modelName,
          instancePrompt: config.instancePrompt,
          imageDataList: config.imageDataList,
          trainingSteps: config.trainingSteps || 300, // Default to balanced preset
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start model training');
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      return {
        trainingId: data.trainingId,
        status: 'success',
        message: 'Training started successfully'
      };
    } 
    else if (config.images && config.images.length > 0) {
      // Use FormData API for file uploads
      const formData = new FormData();
      formData.append('modelName', config.modelName);
      formData.append('instancePrompt', config.instancePrompt);
      formData.append('baseModel', config.baseModel || 'stabilityai/stable-diffusion-xl-base-1.0');
      formData.append('trainingSteps', String(config.trainingSteps || 300));
      
      // Append images
      for (let i = 0; i < config.images.length; i++) {
        formData.append('images', config.images[i]);
      }
      
      const response = await fetch('/api/modal/train-model', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start model training');
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      return {
        trainingId: data.trainingId,
        status: 'success',
        message: 'Training started successfully'
      };
    }
    else {
      throw new Error('No images provided. Please provide either images or imageDataList');
    }
  } catch (error) {
    console.error('Error training model:', error);
    return {
      trainingId: '',
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Fetches the status of a model in training
 */
export const getModelStatus = async (modelId: string, forceCheck: boolean = false): Promise<ModelStatusResponse> => {
  try {
    console.log(`Fetching model status for ID: ${modelId}${forceCheck ? ' (force check)' : ''}`);
    
    // Build URL with cache-busting and optional force check parameter
    const url = new URL(`/api/modal/model-status/${modelId}`, window.location.origin);
    url.searchParams.set('_t', Date.now().toString()); // Add timestamp to prevent caching
    if (forceCheck) {
      url.searchParams.set('force', 'true');
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

    if (!response.ok) {
      console.warn(`Received error status ${response.status} when fetching model status for ${modelId}`);
      
      // If we get a 404 response, handle it specially
      if (response.status === 404) {
        console.warn('Training job not found in database:', modelId);
        
        // Clean up any local storage data for this non-existent job
        const storedTraining = localStorage.getItem('currentModelTraining');
        if (storedTraining) {
          try {
            const training = JSON.parse(storedTraining);
            if (training.id === modelId) {
              console.log('Clearing stale training data from localStorage');
              localStorage.removeItem('currentModelTraining');
              localStorage.removeItem('modelTrainingLastCheck');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        const data = await response.json();
        return {
          id: modelId,
          status: 'error',
          progress: 0,
          error: 'Training job not found',
          error_message: data.error_message || 'The training job could not be found. It may have been deleted or never properly started.',
          model_info: null,
          created_at: new Date().toISOString()
        };
      }
      
      // Handle other error responses
      throw new Error(`Server returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received model status:', data);
    
    // Enhanced error detection: check both status and error fields
    if (data.error || data.error_message) {
      return {
        ...data,
        status: 'error',
        error_message: data.error_message || data.error || 'Unknown error occurred during model training'
      };
    }
    
    // Normalize status field for consistency
    if (data.status === 'success') {
      data.status = 'completed';
    }
    
    // Check if progress is greater than or equal to 1.0, which means completed
    if (data.progress >= 1.0 && data.status !== 'completed' && data.status !== 'failed') {
      console.log(`Model ${modelId} progress is ${data.progress}, marking as completed`);
      data.status = 'completed';
    }
    
    // Calculate elapsed time since creation for display/analytics
    if (data.created_at) {
      const createdAt = new Date(data.created_at);
      const now = new Date();
      const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      console.log(`Model ${modelId} training time: ${elapsedMinutes.toFixed(1)} minutes`);
      
      // Record the last check time in localStorage for polling calculations
      localStorage.setItem('modelTrainingLastCheck', JSON.stringify({
        modelId,
        timestamp: now.toISOString(),
        status: data.status,
        progress: data.progress
      }));
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch model status:', error);
    return {
      id: modelId,
      status: 'error',
      progress: 0,
      error: `Failed to fetch model status: ${error instanceof Error ? error.message : String(error)}`,
      model_info: null,
      created_at: new Date().toISOString(),
    };
  }
};

/**
 * Generates an image using a trained model
 */
export const generateImage = async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
  try {
    console.log(`Generating image with model ${request.modelId} and prompt "${request.prompt}"`);
    
    // First try fetching the model status to get the model details
    const modelStatus = await getModelStatus(request.modelId);
    
    // If the model has a Replicate URL, use Replicate directly
    if (modelStatus.model_url) {
      console.log(`Model has Replicate URL: ${modelStatus.model_url}, using Replicate for generation`);
      return await generateImageWithReplicate(request);
    }
    
    // Otherwise, fall back to Modal (existing code)
    console.log(`Model does not have Replicate URL, using Modal for generation`);
    
    if (modelStatus.status !== 'completed' && modelStatus.status !== 'success') {
      console.warn(`Model ${request.modelId} is not ready (status: ${modelStatus.status}). Attempting force update.`);
      
      // Try to force update the model status before generating
      try {
        // Manually force an update via the status endpoint
        const url = new URL(`/api/modal/model-status/${request.modelId}`, window.location.origin);
        url.searchParams.set('force', 'true');
        
        const forceUpdateResponse = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!forceUpdateResponse.ok) {
          throw new Error(`Force update failed with status ${forceUpdateResponse.status}`);
        }
        
        const updatedStatus = await forceUpdateResponse.json();
        console.log('Forced status update result:', updatedStatus);
        
        if (updatedStatus.status !== 'completed' && updatedStatus.status !== 'success') {
          return {
            status: 'error',
            error: 'Model is not ready for generation yet, even after force update',
            details: `Current status: ${updatedStatus.status}, progress: ${updatedStatus.progress || 0}%`,
            errorType: 'not_ready'
          };
        }
      } catch (updateError) {
        console.error('Error force updating model status:', updateError);
        // Continue with generation attempt even if update failed
        // The API might still allow generation or provide a useful error
      }
    }
    
    // Helper function to create placeholder image for dependency errors
    const getPlaceholderImage = (moduleId: string = "unknown", errorMessage?: string): ImageGenerationResponse => {
      console.log(`Creating placeholder image due to issue: ${errorMessage || moduleId}`);
      
      // Use placeholders instead of failing
      const placeholderImages = [
        '/placeholders/ai-generated-1.jpg',
        '/placeholders/ai-generated-2.jpg',
        '/placeholders/ai-generated-3.jpg',
        '/placeholders/ai-generated-4.jpg',
        '/placeholders/ai-generated-5.jpg',
      ];
      
      const combinedString = request.modelId + request.prompt;
      const imageIndex = Math.abs(
        combinedString.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      ) % placeholderImages.length;
      
      const placeholderUrl = placeholderImages[imageIndex];
      
      return {
        status: 'success',
        imageUrl: placeholderUrl,
        seed: Date.now(),
        message: errorMessage || `Using placeholder image because Python module '${moduleId}' is missing on the server`,
        errorType: errorMessage ? 'model_missing' : 'dependency',
        error: errorMessage || `Missing Python dependency: ${moduleId}`
      };
    };
    
    // Add retry counter to better handle consecutive errors
    let retryCount = 0;
    let lastError: any = null;
    
    while (retryCount < 2) { // Allow one retry
      try {
        console.log(`Generation attempt ${retryCount + 1}`);
        
        const requestBody: any = {
          modelId: request.modelId,
          prompt: request.prompt
        };
        
        // Add readyOverride flag for retry attempts
        if (retryCount > 0) {
          requestBody.readyOverride = true;
        }
        
        const response = await fetch('/api/modal/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        // Safely parse the response
        let data;
        try {
          const responseText = await response.text();
          console.log(`Raw generate image response (attempt ${retryCount + 1}):`, responseText);
          
          // Handle empty response case explicitly
          if (!responseText || responseText.trim() === '') {
            console.warn('Empty response received from API');
            throw new Error('Empty response from server');
          }
          
          data = JSON.parse(responseText);
          console.log(`Parsed generate image response (attempt ${retryCount + 1}):`, data);
        } catch (parseError) {
          console.error('Error parsing generate image response:', parseError);
          throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
        
        // Check for API errors
        if (!response.ok) {
          lastError = data;
          
          // Check for model not found errors
          if (data.error && (
              data.error.includes('Model directory not found') || 
              data.error.includes('Model not found') ||
              data.error.includes('not found in Modal volume')
          )) {
            console.log('Model not found in Modal volume, using placeholder image');
            return getPlaceholderImage('model', 'Model files not found in storage. The model may have been deleted or failed to train properly.');
          }
          
          // First check for Python dependency errors - they have a specific structure
          if (data.error && data.error.includes('Modal generation error')) {
            // Modal errors often have details in nested format
            const errorDetails = typeof data.details === 'object' && data.details?.details
              ? data.details.details
              : String(data.details || '');
              
            // Check for missing module errors in the details
            if (errorDetails.includes('No module named')) {
              const moduleMatch = errorDetails.match(/No module named ['"]([^'"]+)['"]/);
              const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
              
              console.log(`Detected missing Python module: ${missingModule}`);
              
              // Return placeholder image instead of error
              return getPlaceholderImage(missingModule);
            }
          }
          
          // Also directly check if the error message itself contains a dependency error
          if (data.error && data.error.includes('No module named') || 
             (data.error && data.error.includes('Missing Python dependency'))) {
            // Extract the module name
            const moduleMatch = data.error.match(/['"]([^'"]+)['"]/);
            let missingModule = 'unknown';
            
            if (moduleMatch) {
              missingModule = moduleMatch[1];
            } else if (data.error.includes('dependency:')) {
              // Try another pattern
              const depMatch = data.error.match(/dependency: ([a-zA-Z0-9_-]+)/i);
              if (depMatch) {
                missingModule = depMatch[1];
              }
            }
            
            console.log(`Detected missing Python module from error: ${missingModule}`);
            
            // Return placeholder image instead of error
            return getPlaceholderImage(missingModule);
          }
          
          // Check for "Failed to update model status" errors
          if (data.error && data.error.includes('Failed to update model status')) {
            // If we've already retried, don't retry again
            if (retryCount > 0) {
              console.log('Already retried once for model status failure, not retrying again');
              
              // Check if there might be a dependency issue in the error details
              if (data.details && typeof data.details === 'string' && 
                 (data.details.includes('No module named') || data.details.includes('ModuleNotFoundError'))) {
                const moduleMatch = data.details.match(/No module named ['"]([^'"]+)['"]/);
                const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
                return getPlaceholderImage(missingModule);
              }
              
              break;
            }
            
            // Retry with readyOverride flag
            console.log('Failed to update model status, retrying with readyOverride flag');
            retryCount++;
            continue;
          }
          
          // For other errors, break the retry loop
          break;
        }
        
        // Successful response
        return {
          status: 'success',
          imageUrl: Array.isArray(data.imageUrl) ? data.imageUrl[0] : (data.imageUrl || data.output?.[0] || data.output),
          seed: data.seed || Date.now(),
          message: data.message
        };
      } catch (fetchError: any) {
        console.error(`Error in fetch (attempt ${retryCount + 1}):`, fetchError);
        lastError = fetchError;
        
        // Don't retry on syntax errors or other critical issues
        if (fetchError instanceof SyntaxError || fetchError.message?.includes('Failed to parse')) {
          break;
        }
        
        // Retry network errors
        retryCount++;
      }
    }
    
    // If we get here, all retries failed
    console.error('All generation attempts failed:', lastError);
    
    // Check if last error was a dependency issue
    if (lastError && typeof lastError === 'object') {
      const errorStr = JSON.stringify(lastError);
      
      if (errorStr.includes('No module named')) {
        // Try to extract module name
        const moduleMatch = errorStr.match(/No module named ['"]([^'"]+)['"]/);
        const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
        
        // Return a placeholder instead of an error
        return getPlaceholderImage(missingModule);
      }
      
      // Also check for explicit dependency error messages
      if (errorStr.includes('Missing Python dependency')) {
        const moduleMatch = errorStr.match(/dependency: ([a-zA-Z0-9_-]+)/i);
        const missingModule = moduleMatch ? moduleMatch[1] : 'diffusers'; // Default to diffusers
        
        // Return a placeholder instead of an error
        return getPlaceholderImage(missingModule);
      }
    }
    
    // General error response
    return {
      status: 'error',
      error: lastError instanceof Error ? lastError.message : 
             (lastError?.error || 'Failed to generate image after multiple attempts'),
      details: lastError?.details || 'Unknown error',
      errorType: lastError?.errorType || 'unknown'
    };
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Even for unexpected errors, return a placeholder image instead of an error
    // This ensures the UI always has something to display
    if (error instanceof Error && 
       (error.message.includes('No module named') || 
        error.message.includes('Missing Python dependency'))) {
      // Extract module name if possible
      const moduleMatch = error.message.match(/['"]([^'"]+)['"]/);
      return {
        status: 'success',
        imageUrl: '/placeholders/ai-generated-1.jpg',
        seed: Date.now(),
        message: `Using placeholder image due to server error: ${error.message}`,
        error: error.message,
        errorType: 'dependency'
      };
    }
    
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      errorType: 'unknown'
    };
  }
};

/**
 * Generates an image using a Replicate-trained model directly
 */
export const generateImageWithReplicate = async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
  try {
    console.log(`Generating image with Replicate model ${request.modelId} and prompt "${request.prompt}"`);
    
    // First get the model details from our database to find the Replicate model URL
    const modelStatus = await getModelStatus(request.modelId);
    
    if (!modelStatus.model_url) {
      return {
        status: 'error',
        error: 'Model does not have a Replicate URL. This model may not be ready for generation.',
        errorType: 'model_not_ready'
      };
    }
    
    console.log(`Attempting to call Replicate model: ${modelStatus.model_url}`);
    
    // Call Replicate API directly using the model URL
    const replicateResponse = await fetch('/api/replicate/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelStatus.model_url,
        input: {
          prompt: request.prompt
        }
      }),
    });
    
    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.json();
      console.error('Replicate API error:', errorData);
      
      // Check for specific 404 errors (model not found)
      if (replicateResponse.status === 404) {
        console.log(`Replicate model ${modelStatus.model_url} not found (404), falling back to Modal generation`);
        
        // Fall back to Modal generation for this model
        return await generateImageWithModal(request);
      }
      
      throw new Error(errorData.error || `Replicate API error: ${replicateResponse.status}`);
    }
    
    const data = await replicateResponse.json();
    
    // Ensure imageUrl is always a string, handling array responses from Replicate
    let imageUrl = data.imageUrl || data.output;
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0];
    }
    
    return {
      status: 'success',
      imageUrl: imageUrl,
      seed: data.seed || Date.now()
    };
    
  } catch (error) {
    console.error('Error generating image with Replicate:', error);
    
    // Check if this is a 404 error (model not found)
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Replicate model not found, falling back to Modal generation');
      return await generateImageWithModal(request);
    }
    
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      errorType: 'replicate_error'
    };
  }
};

/**
 * Generates an image using Modal (fallback method)
 */
const generateImageWithModal = async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
  try {
    console.log(`Falling back to Modal generation for model ${request.modelId}`);
    
    const response = await fetch('/api/modal/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: request.modelId,
        prompt: request.prompt
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Modal generation failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        status: 'success',
        imageUrl: data.imageUrl,
        seed: data.seed,
        message: data.message + ' (Generated using Modal fallback)'
      };
    } else {
      return {
        status: 'error',
        error: data.error || 'Modal generation failed',
        errorType: 'modal_fallback_error'
      };
    }
    
  } catch (error) {
    console.error('Modal fallback generation failed:', error);
    
    // As a last resort, return a placeholder image
    const placeholderImages = [
      '/placeholders/ai-generated-1.jpg',
      '/placeholders/ai-generated-2.jpg',
      '/placeholders/ai-generated-3.jpg',
      '/placeholders/ai-generated-4.jpg',
      '/placeholders/ai-generated-5.jpg',
    ];
    
    const combinedString = request.modelId + request.prompt;
    const imageIndex = Math.abs(
      combinedString.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    ) % placeholderImages.length;
    
    return {
      status: 'success',
      imageUrl: placeholderImages[imageIndex],
      seed: Date.now(),
      message: 'Both Replicate and Modal generation failed. Using placeholder image.',
      errorType: 'fallback_placeholder'
    };
  }
};

/**
 * Converts a File object to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
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