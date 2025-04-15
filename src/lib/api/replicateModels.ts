import { API_CONFIG } from '../config';
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

/**
 * Interface for trained model information
 */
export interface TrainedModel {
  id: string;
  name: string;
  description?: string;
  version: string;
  model_url: string;
  status: 'training' | 'active' | 'failed';
  created_at: string;
  input_parameters?: Record<string, any>;
}

/**
 * Interface for generation with a trained model
 */
export interface ModelGenerationInput {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  scheduler?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  lora_scale?: number;
  [key: string]: any;
}

/**
 * Start training a new model with the Flux LoRA trainer
 */
export const trainCustomModel = async (formData: FormData) => {
  try {
    const response = await fetch('/api/models/train', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start model training');
    }

    return await response.json();
  } catch (error) {
    console.error("Error training custom model:", error);
    throw error;
  }
};

/**
 * Generate images using a custom trained model
 */
export const generateWithCustomModel = async (
  modelVersion: string,
  input: ModelGenerationInput
) => {
  try {
    // First check if the model version exists and is valid
    if (!modelVersion || !modelVersion.includes(':')) {
      throw new Error('Invalid model version format. Expected owner/model:version');
    }

    const response = await fetch('/api/replicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: modelVersion,
        input,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate with custom model');
    }

    const { output } = await response.json();
    return output;
  } catch (error) {
    console.error("Error generating with custom model:", error);
    throw error;
  }
};

/**
 * Get information about a custom trained model
 */
export const getCustomModelInfo = async (predictionId: string) => {
  try {
    const response = await fetch(`/api/models/${predictionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get model information');
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting custom model info:", error);
    throw error;
  }
};

/**
 * List all custom trained models
 */
export const listCustomModels = async () => {
  try {
    const response = await fetch('/api/models', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list custom models');
    }

    return await response.json();
  } catch (error) {
    console.error("Error listing custom models:", error);
    throw error;
  }
};

/**
 * Check the status of a training job
 */
export const checkTrainingStatus = async (predictionId: string) => {
  try {
    // Use server API to check status
    const response = await fetch(`/api/models/status/${predictionId}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check training status');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error checking training status:", error);
    throw error;
  }
}; 