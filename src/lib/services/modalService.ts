import axios from 'axios';

export interface TrainModelParams {
  images: File[];
  instancePrompt: string;
  modelName: string;
  trainingSteps?: number;
}

export interface ModelTrainingResponse {
  status: 'success' | 'error' | 'training';
  modelInfo?: {
    model_name: string;
    base_model: string;
    instance_prompt: string;
    created_at: string;
    training_steps: number;
  };
  sampleImageBase64?: string;
  error?: string;
  trainingId?: string;
  message?: string;
  progress?: number;
}

export interface ModelTrainingProgressUpdate {
  progress: number; 
  message: string;
  step: number;
  totalSteps: number;
}

/**
 * Trains a custom image generation model using Modal and Stable Diffusion with LoRA
 */
export const trainCustomModel = async ({
  images,
  instancePrompt,
  modelName,
  trainingSteps = 1000,
}: TrainModelParams): Promise<ModelTrainingResponse> => {
  try {
    // Step 1: Prepare image data
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

    // Step 2: Start model training
    const { data: trainingResponse } = await axios.post('/api/modal/train-model', {
      imageDataList,
      instancePrompt,
      modelName,
      trainingSteps,
      callbackUrl: `${window.location.origin}/api/modal/training-progress`,
    });

    return trainingResponse;
  } catch (error) {
    console.error('Error training custom model:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Fetches the status of a model in training
 */
export const getModelTrainingStatus = async (modelId: string): Promise<ModelTrainingResponse> => {
  try {
    console.log(`Fetching model status for ID: ${modelId}`);
    
    if (!modelId) {
      console.error('Model ID is missing');
      return {
        status: 'error',
        error: 'Model ID is required'
      };
    }
    
    const { data } = await axios.get(`/api/modal/model-status/${modelId}`);
    console.log('Received model status:', data);
    
    // Validate the response
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data);
      return {
        status: 'error',
        error: 'Invalid response format from server'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching model status:', error);
    
    // Extract more detailed error information from Axios error
    let errorMsg = 'Unknown error occurred';
    let statusCode = 500;
    
    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500;
      
      // Try to extract error message from response
      if (error.response?.data) {
        const responseData = error.response.data;
        if (typeof responseData === 'string') {
          errorMsg = responseData;
        } else if (typeof responseData === 'object' && responseData.error) {
          errorMsg = responseData.error;
        } else {
          errorMsg = `Server error: ${statusCode}`;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    
    return {
      status: 'error',
      error: errorMsg,
    };
  }
};

/**
 * Converts a File object to base64 string
 */
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