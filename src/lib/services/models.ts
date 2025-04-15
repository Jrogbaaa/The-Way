import { useTrainedModelsStore } from '@/stores/trainedModelsStore';

interface FluxLoraModel {
  id: string;
  status: string;
  version: string;
  urls: {
    get: string;
  };
  metrics: any;
  output: any;
  error: string | null;
}

// Add model interface with the missing properties
interface TrainedModel {
  id: string;
  name: string;
  status: string;
  replicate_id?: string;
  trigger_word?: string;
  last_used?: Date;
  metadata?: {
    triggerWord?: string;
    outputModel?: string;
    trainingStarted?: string;
    trainingJobId?: string;
  };
}

/**
 * Check the status of a Flux LoRA model in training
 * @param modelId The Replicate prediction ID
 * @returns The model training status
 */
export async function checkFluxModelStatus(modelId: string): Promise<FluxLoraModel> {
  try {
    // Make sure we have a valid API token
    if (!process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN) {
      console.error('Missing Replicate API token');
      throw new Error('Missing Replicate API token');
    }
    
    // Add retry and timeout logic
    const response = await fetch(`https://api.replicate.com/v1/predictions/${modelId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch model status for ${modelId}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch model status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking Flux model status:', error);
    
    // Return a default model status that won't break the UI
    return {
      id: modelId,
      status: 'processing', // Use 'processing' to keep showing as in-progress
      version: '',
      urls: { get: '' },
      metrics: {},
      output: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Update the status of a model in training
 * @param replicateId The Replicate prediction ID
 */
export async function updateModelTrainingStatus(replicateId: string): Promise<void> {
  try {
    // Get the model status from Replicate
    const modelData = await checkFluxModelStatus(replicateId);
    
    // Get the store's state & functions
    const store = useTrainedModelsStore.getState();
    
    // Find the model with this Replicate ID
    const model = store.trainedModels.find(m => m.replicate_id === replicateId);
    
    if (!model) {
      console.warn(`No model found with Replicate ID: ${replicateId}`);
      return;
    }
    
    // Map Replicate status to our app's status
    let status: 'training' | 'ready' | 'failed';
    
    switch (modelData.status) {
      case 'succeeded':
        status = 'ready';
        console.log(`Model ${model.name} (${replicateId}) training completed successfully`);
        break;
      case 'failed':
        status = 'failed';
        console.log(`Model ${model.name} (${replicateId}) training failed: ${modelData.error}`);
        break;
      case 'canceled':
        status = 'failed';
        console.log(`Model ${model.name} (${replicateId}) training was canceled`);
        break;
      default:
        status = 'training';
        console.log(`Model ${model.name} (${replicateId}) still training (status: ${modelData.status})`);
    }
    
    // Update the model status
    store.updateModelStatus(model.id, status, {
      ...model.metadata,
      version: modelData.version,
      output: modelData.output,
      lastChecked: new Date().toISOString(),
    });
    
    console.log(`Updated model status: ${model.name} (${replicateId}) - ${status}`);
  } catch (error) {
    console.error('Error updating model status:', error);
    // Don't throw the error further as this runs in a background process
  }
}

/**
 * Generate an image using a trained Flux LoRA model
 * @param prompt The image prompt
 * @param modelId The model ID from our app
 * @returns The generated image URL
 */
export async function generateWithFluxModel(prompt: string, modelId: string): Promise<string> {
  try {
    // Get the model from the store
    const store = useTrainedModelsStore.getState();
    const model = store.trainedModels.find(m => m.id === modelId);
    
    if (!model || !model.replicate_id) {
      throw new Error('Model not found or missing Replicate ID');
    }
    
    console.log('Found model:', model);
    
    // We need the trigger word for the model
    const triggerWord = model.trigger_word || 
                       model.metadata?.triggerWord || 
                       'lora';
    
    // Make sure the trigger word is in the prompt
    const finalPrompt = prompt.toLowerCase().includes(triggerWord.toLowerCase())
      ? prompt
      : `${prompt}, ${triggerWord}`;
      
    // Get the model output URL if available, otherwise use the default format
    // Model training might still be in progress, so handle that case
    let loraUrl;
    
    // If the model is still training or we don't have output info
    if (model.status === 'training' || !model.metadata?.outputModel) {
      throw new Error('Model is still training. Please wait for training to complete before generating images.');
    } else {
      // If we have a full model URL (which might happen with external models)
      if (model.metadata?.outputModel && model.metadata.outputModel.startsWith('http')) {
        loraUrl = model.metadata.outputModel;
      } 
      // If we have a prediction ID and output path
      else if (model.replicate_id) {
        loraUrl = `https://replicate.delivery/pbxt/${model.replicate_id}/trained_model.tar`;
      } 
      // Fallback to a default value if nothing else works
      else {
        throw new Error('Cannot find model URL. The model might not be ready yet.');
      }
    }
    
    console.log('Using LoRA URL:', loraUrl);
    console.log('Final prompt:', finalPrompt);
    
    // Call the Flux model for inference
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "ea3ed3a1c9c3c8a399ba2e1300f964eb8e8eb6533e32b28c785ab617491e4bdf",
        input: {
          prompt: finalPrompt,
          lora: loraUrl,
          num_outputs: 1,
          scheduler: "K_EULER_ANCESTRAL",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          prompt_strength: 1,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
          apply_watermark: false
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${JSON.stringify(errorData)}`);
    }
    
    const prediction = await response.json();
    console.log('Prediction result:', prediction);
    
    // Update the model's last_used timestamp
    store.updateTrainedModel(model.id, {
      last_used: new Date()
    });
    
    // Return the URL to the generated image
    return prediction.output[0];
  } catch (error) {
    console.error('Error generating with Flux model:', error);
    throw error;
  }
} 