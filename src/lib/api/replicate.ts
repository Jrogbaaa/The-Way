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
  
  try {
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const { output } = await response.json();
    return output;
  } catch (error) {
    console.error("Error running SDXL model:", error);
    throw error;
  }
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