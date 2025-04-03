import { API_CONFIG, AI_MODELS } from '../config';

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

/**
 * Run prediction using the Cristina model
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
      
      // Validate that the output contains at least one URL
      if (Array.isArray(data.output) && data.output.length === 0) {
        throw new Error('No images were generated');
      }

      console.log('SDXL model generated output successfully');
      return data.output;
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
  try {
    // Format must match expected type: `${string}/${string}` | `${string}/${string}:${string}`
    const modelString = `${owner}/${name}:${version}`;
    // Use a type assertion to override the TypeScript constraint
    const output = await replicate.run(modelString as any, { input });
    
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
  try {
    // Create a prediction
    let prediction = await replicate.predictions.create({
      version,
      input,
    });
    
    // Wait for the prediction to complete
    prediction = await replicate.wait(prediction);
    
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
  try {
    const model = await replicate.models.get(owner, name);
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
  try {
    const versions = await replicate.models.versions.list(owner, name);
    return versions;
  } catch (error) {
    console.error(`Error getting model versions (${owner}/${name}):`, error);
    throw error;
  }
};

/**
 * Handle file upload for model input
 * Useful for models that accept image inputs
 */
export const uploadFile = async (fileData: Buffer | Blob) => {
  try {
    // According to the docs, files.create expects the file as its first parameter
    const uploadedFile = await replicate.files.create(fileData);
    return uploadedFile;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
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
}; 