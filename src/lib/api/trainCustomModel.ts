import { v4 as uuidv4 } from 'uuid';
import { useTrainedModelsStore } from '@/stores/trainedModelsStore';

/**
 * Uploads a file to temporary storage and returns a public URL
 * 
 * This function handles the file upload process, sending the file to the server's
 * upload endpoint. In production, it will store the file in Supabase storage.
 * In development, it may use local storage as a fallback.
 * 
 * @param {File} file - The zip file to upload
 * @returns {Promise<string>} Public URL to the uploaded file
 * @throws {Error} When upload fails
 */
export async function uploadFileToStorage(file: File): Promise<string> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the file to our API endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Validates a zip file to ensure it only contains image files
 * 
 * This function performs comprehensive validation on the uploaded ZIP file:
 * 1. Verifies the file is a valid ZIP format
 * 2. Extracts and checks each file within the ZIP
 * 3. Validates that all files are images using both file extensions and magic bytes
 * 4. Ensures the ZIP contains at least one valid image file
 * 
 * @param {File} file - The zip file to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 * @throws {Error} When validation process fails
 */
export async function validateZipFile(file: File): Promise<boolean> {
  try {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    
    // Send the file to our validation endpoint
    const response = await fetch('/api/validate-zip', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to validate file');
    }
    
    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Error validating zip file:', error);
    throw error;
  }
}

/**
 * Trains a custom model using Replicate's flux-dev-lora-trainer
 * 
 * This function initiates the training process for a custom model:
 * 1. Creates a new model entry in the store with 'training' status
 * 2. Ensures URLs are properly formatted for Replicate API
 * 3. Initiates the training process via the server API
 * 4. Updates the model with the Replicate prediction ID upon success
 * 5. Handles errors and updates model status accordingly
 * 
 * Special considerations:
 * - Includes browser environment detection
 * - Handles both direct file uploads and public URLs
 * - Provides fallback mechanisms for state management issues
 * - Ensures proper absolute URLs for Replicate access
 * 
 * @param {string} zipFileUrl - URL to the uploaded zip file (can be local or remote)
 * @param {string} modelName - Name for the custom model
 * @returns {Promise<string>} ID of the created model in the store
 * @throws {Error} When training initiation fails
 */
export async function trainCustomModel(zipFileUrl: string, modelName: string): Promise<string> {
  try {
    // Generate a unique model ID
    const modelId = uuidv4();
    console.log('Generated model ID:', modelId);
    
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      throw new Error('This function must be called in a browser environment');
    }
    
    // Get the store
    const store = useTrainedModelsStore.getState();
    
    // Debug current models
    console.log('Current models before adding:', store.trainedModels);
    
    // Use the store's addTrainedModel function which handles ID generation
    store.addTrainedModel({
      name: modelName,
      status: 'training',
      description: `Custom model of ${modelName}`,
      category: 'Custom',
      metadata: {
        modelType: 'flux-lora',
        trainingStarted: new Date().toISOString(),
      }
    });
    
    // Wait a moment for the state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the latest state
    const updatedStore = useTrainedModelsStore.getState();
    console.log('Current models after adding:', updatedStore.trainedModels);
    
    // Find the newly created model - should be the most recent one with this name
    const newModels = updatedStore.trainedModels.filter(
      model => model.name === modelName && model.status === 'training'
    );
    
    if (!newModels || newModels.length === 0) {
      console.error('No models found with name:', modelName);
      
      // As a fallback, create a model object with the ID we generated
      const fallbackModelId = modelId;
      console.log('Using fallback model ID:', fallbackModelId);
      
      // Convert local URL to absolute URL if needed
      const absoluteZipFileUrl = zipFileUrl.startsWith('/')
        ? `${window.location.origin}${zipFileUrl}`
        : zipFileUrl;
      
      // Now start the training process via our API endpoint
      const response = await fetch('/api/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: fallbackModelId,
          zipFileUrl: absoluteZipFileUrl,
          modelName,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to train model');
      }
      
      const data = await response.json();
      console.log('Training initiated with response:', data);
      
      return fallbackModelId;
    }
    
    // Use the most recently created model (last one in the array)
    const newModel = newModels[newModels.length - 1];
    console.log('Selected new model:', newModel);
    
    // Convert local URL to absolute URL if needed
    const absoluteZipFileUrl = zipFileUrl.startsWith('/')
      ? `${window.location.origin}${zipFileUrl}`
      : zipFileUrl;
    
    console.log('Using zip file URL:', absoluteZipFileUrl);
    
    // Now start the training process via our API endpoint
    const response = await fetch('/api/train-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: newModel.id,
        zipFileUrl: absoluteZipFileUrl,
        modelName,
      }),
    });
    
    if (!response.ok) {
      // If the API call fails, update the model status to failed
      store.updateModelStatus(newModel.id, 'failed', {
        error: 'Failed to start training process',
      });
      
      const error = await response.json();
      throw new Error(error.message || 'Failed to train model');
    }
    
    const data = await response.json();
    console.log('Training initiated with response:', data);
    
    // Update the model with the Replicate prediction ID
    store.updateTrainedModel(newModel.id, {
      replicate_id: data.replicateId,
      metadata: {
        ...newModel.metadata,
        trainingJobId: data.replicateId,
        triggerWord: data.triggerWord
      }
    });
    
    return newModel.id;
  } catch (error) {
    console.error('Error training custom model:', error);
    throw error;
  }
} 