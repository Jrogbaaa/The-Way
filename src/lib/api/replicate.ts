import { API_CONFIG, AI_MODELS } from '../config';
// Import the function to get the actual server-side client
import { getReplicateClient } from '../replicate-client';

// Interface for prediction input parameters
export interface PredictionInput {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  scheduler?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  [key: string]: any; // Allow for custom parameters
}

// Add a new interface for image-to-video input parameters
export interface ImageToVideoInput {
  image: string; // Base64 or URL
  prompt?: string;
  negative_prompt?: string;
  num_frames?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  motion_bucket_id?: number;
  fps?: number;
  noise_aug_strength?: number;
}

/**
 * Run prediction using the Cristina model
 * This function seems to call a local API endpoint '/api/replicate',
 * so it doesn't directly need the server-side Replicate client here.
 * It should remain unchanged unless '/api/replicate' needs fixing.
 */
export const runCristinaModel = async (input: PredictionInput) => {
  const modelId = `${AI_MODELS.cristina.id}:${AI_MODELS.cristina.version}`;
  
  try {
    const response = await fetch('/api/replicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId,
        input: {
          ...AI_MODELS.cristina.defaultParams,
          ...input,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Network error: ${response.status} ${response.statusText}` }));
      throw new Error(error.error || `Failed to generate image. Status: ${response.status}`);
    }

    const { output } = await response.json();
    return output;
  } catch (error) {
    console.error("Error running Cristina model:", error);
    // Provide more diagnostic info when the error might be related to an ad blocker
    if (error instanceof TypeError && error.message.includes('network')) {
      throw new Error("Network error: This could be caused by an ad blocker or network connectivity issue. Try disabling any ad blockers for this site.");
    }
    throw error;
  }
};

/**
 * Run prediction using the Jaime model
 * This function also calls '/api/replicate' and should remain unchanged.
 */
export const runJaimeModel = async (input: PredictionInput) => {
  const modelId = `${AI_MODELS.jaime.id}:${AI_MODELS.jaime.version}`;
  
  try {
    const response = await fetch('/api/replicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId,
        input: {
          ...AI_MODELS.jaime.defaultParams,
          ...input,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Network error: ${response.status} ${response.statusText}` }));
      throw new Error(error.error || `Failed to generate image. Status: ${response.status}`);
    }

    const { output } = await response.json();
    return output;
  } catch (error) {
    console.error("Error running Jaime model:", error);
    // Provide more diagnostic info when the error might be related to an ad blocker
    if (error instanceof TypeError && error.message.includes('network')) {
      throw new Error("Network error: This could be caused by an ad blocker or network connectivity issue. Try disabling any ad blockers for this site.");
    }
    throw error;
  }
};

/**
 * Run prediction using the SDXL model
 * This function also calls '/api/replicate' and should remain unchanged.
 */
export const runSdxlModel = async (input: PredictionInput) => {
  const modelId = `${AI_MODELS.sdxl.id}:${AI_MODELS.sdxl.version}`;
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between retries
      if (attempt > 0) {
        console.log(`Retrying SDXL model request (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          input: {
            ...AI_MODELS.sdxl.defaultParams,
            ...input,
          },
        }),
      });

      // Parse response first to get error details if present
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate image: ${response.status} ${response.statusText}`);
      }

      // Check if output exists and is in the expected format
      if (!data.output) {
        throw new Error('Invalid response format: missing output field');
      }
      
      // Log the output type and structure to help with debugging
      console.log('SDXL output type:', typeof data.output);
      console.log('SDXL output is array:', Array.isArray(data.output));
      
      // Process the output to ensure it's in a valid format
      let processedOutput = data.output;
      
      if (Array.isArray(data.output)) {
        // Filter array to only include string values
        processedOutput = data.output.filter((item: any) => {
          if (typeof item === 'string') return true;
          // Log non-string items for debugging
          console.log('Non-string item in output array:', item);
          return false;
        });
        
        if (processedOutput.length === 0) {
          throw new Error('No valid image URLs were generated');
        }
      } else if (typeof data.output === 'object' && data.output !== null) {
        // If we get an object, try to extract the URL
        if (data.output.url) {
          processedOutput = [data.output.url];
        } else if (data.output.image) {
          processedOutput = [data.output.image];
        } else {
          console.log('Unexpected output format (object without url):', data.output);
          throw new Error('Invalid output format: no URL found in response object');
        }
      } else if (typeof data.output !== 'string') {
        console.log('Unexpected output format:', data.output);
        throw new Error(`Invalid output format: expected string or array, got ${typeof data.output}`);
      }

      console.log('SDXL model generated output successfully');
      return processedOutput;
    } catch (error) {
      console.error(`Error running SDXL model (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      // Otherwise continue to the next retry
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error occurred');
};

/**
 * Run prediction using a custom model version
 * Note: The model ID should be in the format "owner/name" and version should be the model version hash
 */
export const runCustomModel = async (
  owner: string,
  name: string,
  version: string,
  input: Record<string, any>
) => {
  // Get the actual server-side client
  const client = getReplicateClient();
  try {
    // Format must match expected type: `${string}/${string}` | `${string}/${string}:${string}`
    const modelString = `${owner}/${name}:${version}` as const; // Use 'as const' for better type safety
    // Use the actual client instance
    const output = await client.run(modelString, { input });

    return output;
  } catch (error) {
    console.error(`Error running custom model (${owner}/${name}):`, error);
    throw error;
  }
};

/**
 * Create a prediction and wait for completion
 * Useful for long-running operations
 */
export const createAndWaitPrediction = async (
  version: string,
  input: Record<string, any>
) => {
  // Get the actual server-side client
  const client = getReplicateClient();
  try {
    // Create a prediction using the actual client
    let prediction = await client.predictions.create({
      version,
      input,
    });

    // Wait for the prediction to complete using the actual client
    prediction = await client.wait(prediction);

    return prediction.output;
  } catch (error) {
    console.error(`Error creating prediction:`, error);
    throw error;
  }
};

/**
 * Get model information
 */
export const getModelInfo = async (owner: string, name: string) => {
  // Get the actual server-side client
  const client = getReplicateClient();
  try {
    // Use the actual client instance
    const model = await client.models.get(owner, name);
    return model;
  } catch (error) {
    console.error(`Error getting model info (${owner}/${name}):`, error);
    throw error;
  }
};

/**
 * Get model versions
 */
export const getModelVersions = async (owner: string, name: string) => {
  // Get the actual server-side client
  const client = getReplicateClient();
  try {
    // Use the actual client instance
    const versions = await client.models.versions.list(owner, name);
    return versions;
  } catch (error) {
    console.error(`Error getting model versions (${owner}/${name}):`, error);
    throw error;
  }
};

/**
 * Upload a file to Replicate (e.g., for training data)
 * This requires the server-side client
 */
export const uploadFile = async (fileData: Buffer | Blob) => {
   // Get the actual server-side client
   const client = getReplicateClient();
  try {
    // Directly use the client's file upload method
    // The actual method might differ based on the replicate library version/API
    // Assuming a hypothetical client.files.upload method
    // ** Placeholder: Adjust based on actual Replicate SDK capabilities for uploads **
    // const uploadResult = await client.files.upload(fileData);
    // return uploadResult;
    console.warn("Replicate file upload function is not fully implemented in replicate.ts");
    throw new Error("Replicate file upload not implemented");
  } catch (error) {
    console.error(`Error uploading file:`, error);
    throw error;
  }
};

/**
 * Run image-to-video model
 * This function seems to call a local API endpoint '/api/video/huggingface-generate',
 * so it doesn't directly need the server-side Replicate client here.
 * It should remain unchanged unless the API route needs fixing.
 */
export const runImageToVideoModel = async (input: ImageToVideoInput) => {
  const modelId = `${AI_MODELS.wan2_i2v.id}:${AI_MODELS.wan2_i2v.version}`;
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between retries
      if (attempt > 0) {
        console.log(`Retrying image-to-video model request (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const response = await fetch('/api/video/image-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...AI_MODELS.wan2_i2v.defaultParams,
          ...input,
        }),
      });

      // Parse response first to get error details if present
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate video: ${response.status} ${response.statusText}`);
      }

      // For immediate response with prediction ID
      if (data.predictionId && data.status === 'started') {
        console.log('Video generation started with prediction ID:', data.predictionId);
        return {
          predictionId: data.predictionId,
          status: data.status,
          message: data.message
        };
      }
      
      // For wait-for-result response
      if (data.output) {
        console.log('Video generated successfully:', data.output);
        return data.output;
      }
      
      // If we reached here without a valid output, throw an error
      throw new Error('Invalid response format: missing output or prediction ID');
    } catch (error) {
      console.error(`Error running image-to-video model (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      // Otherwise continue to the next retry
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error occurred');
};

/**
 * Check status of video generation prediction
 * This function also calls a local API endpoint '/api/models/status' and should remain unchanged.
 */
export const checkVideoGenerationStatus = async (predictionId: string) => {
  try {
    const response = await fetch(`/api/video/image-to-video/status?id=${predictionId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Failed to check status: ${response.status} ${response.statusText}`);
    }
    
    // If there's a cached URL, use it instead of the original output
    if (data.cachedVideoUrl && typeof data.cachedVideoUrl === 'string') {
      console.log(`Using cached video URL: ${data.cachedVideoUrl}`);
      
      // If the output is a string, replace it
      if (typeof data.output === 'string') {
        data.output = data.cachedVideoUrl;
      } 
      // If the output is an array, replace the first element
      else if (Array.isArray(data.output) && data.output.length > 0) {
        data.output[0] = data.cachedVideoUrl;
      }
      
      // Also include the cached URL in the response
      data.cachedVideoUrl = data.cachedVideoUrl;
    }
    
    return data;
  } catch (error) {
    console.error('Error checking video generation status:', error);
    throw error;
  }
};

/**
 * Fetch model details from Supabase or mock data
 * This doesn't use the Replicate client directly.
 */
export const getModelDetails = async (modelName: string): Promise<any> => {
  console.warn("getModelDetails is a placeholder in replicate.ts");
  // Placeholder implementation - Fetch from Supabase or return mock data
  // Replace with actual logic
  return null; // Added return statement
};

/**
 * Get Supabase storage URL for a model
 * This doesn't use the Replicate client directly.
 */
export const getModelStorageUrl = async (modelName: string): Promise<string | null> => {
  console.warn("getModelStorageUrl is a placeholder in replicate.ts");
 // Placeholder implementation - Fetch from Supabase storage
 // Replace with actual logic
 return null; // Added return statement
};

export default {
  runCristinaModel,
  runJaimeModel,
  runSdxlModel,
  runCustomModel,
  createAndWaitPrediction,
  getModelInfo,
  getModelVersions,
  uploadFile,
  runImageToVideoModel,
  checkVideoGenerationStatus,
  getModelDetails,
  getModelStorageUrl,
}; 