import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';
import JSZip from 'jszip';

// Initialize Replicate client
const replicate = new Replicate({
  auth: API_CONFIG.replicateApiToken,
});

// Flux LoRA trainer model
const FLUX_TRAINER_MODEL = "ostris/flux-dev-lora-trainer";
const FLUX_TRAINER_VERSION = "a1ee9969b59eabda5054606095f5513696cbbb3ce9e63ffcde2d74b7fe632f1e";

/**
 * Process and start model training with Replicate Flux LoRA trainer
 * Handles multipart form data with training images or a zip file
 */
export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const baseModelId = formData.get('base_model_id') as string;
    const isPublic = (formData.get('is_public') as string) === 'true';
    const parametersJson = formData.get('parameters') as string;
    const parameters = JSON.parse(parametersJson);
    
    // Get all the training images
    let trainingImages: File[] = [];
    const formFiles = formData.getAll('training_data') as File[];
    
    // Check if we have a zip file
    const zipFile = formFiles.find(file => file.type === 'application/zip' || file.name.endsWith('.zip'));
    
    if (zipFile) {
      console.log('Zip file detected, extracting images...');
      // Extract images from the zip file
      const zipBuffer = await zipFile.arrayBuffer();
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipBuffer);
      
      // Process each file in the zip
      const imagePromises: Promise<File>[] = [];
      zipContent.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
        if (!zipEntry.dir) {
          const lowercasePath = relativePath.toLowerCase();
          // Check if file is an image
          if (lowercasePath.endsWith('.jpg') || lowercasePath.endsWith('.jpeg') || 
              lowercasePath.endsWith('.png') || lowercasePath.endsWith('.webp')) {
            
            const promise = zipEntry.async('blob').then((blob: Blob) => {
              // Convert blob to File object
              return new File([blob], relativePath, { type: getFileType(relativePath) });
            });
            imagePromises.push(promise);
          }
        }
      });
      
      trainingImages = await Promise.all(imagePromises);
      console.log(`Extracted ${trainingImages.length} images from zip file`);
    } else {
      // Use individual image files
      trainingImages = formFiles.filter(file => 
        file.type === 'image/jpeg' || 
        file.type === 'image/png' || 
        file.type === 'image/webp'
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }
    
    if (trainingImages.length === 0) {
      return NextResponse.json(
        { error: 'No training images found. Please upload images or a zip file containing images.' },
        { status: 400 }
      );
    }
    
    // Upload each training image to Replicate
    console.log(`Uploading ${trainingImages.length} training images...`);
    const uploadedImages = await Promise.all(
      trainingImages.map(async (file) => {
        try {
          const buffer = await file.arrayBuffer();
          const fileData = Buffer.from(buffer);
          const uploadedFile = await replicate.files.create(fileData);
          return uploadedFile.urls.get;
        } catch (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
    );
    
    console.log('Images uploaded:', uploadedImages);
    
    // Construct the input parameters for the Flux LoRA trainer
    const trainingInput = {
      // Standard parameters
      name: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),  // Sanitize name for model ID
      resolution: parameters.resolution || 512,
      train_batch_size: parameters.train_batch_size || 1,
      num_train_epochs: parameters.num_train_epochs || 1,
      gradient_accumulation_steps: parameters.gradient_accumulation_steps || 4,
      learning_rate: parameters.learning_rate || 1e-4,
      lr_scheduler: parameters.lr_scheduler || "constant",
      use_8bit_adam: parameters.use_8bit_adam !== false,
      xformers_attention: parameters.xformers_attention !== false,
      
      // Flux-specific
      base_model_name: baseModelId || "stabilityai/stable-diffusion-xl-base-1.0",
      instance_images: uploadedImages,
      caption_prefix: `${name.replace(/[^a-zA-Z0-9 ]/g, '')} style`, // Create a safe caption prefix
      clip_skip: parameters.clip_skip || 2,
      
      // Add metadata
      model_description: description || `Custom LoRA model for ${name}`,
      username: "app_user",
      is_private: !isPublic,
    };
    
    console.log('Creating training job with parameters:', trainingInput);
    
    // Create the training prediction with webhook
    const prediction = await replicate.predictions.create({
      version: FLUX_TRAINER_VERSION,
      input: trainingInput,
      webhook: process.env.REPLICATE_WEBHOOK_URL,
      webhook_events_filter: ["completed"] // Only using the "completed" event which is a valid WebhookEventType
    });
    
    console.log('Training job created:', prediction.id);
    
    // Return the prediction ID and status to the client
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
      model: {
        name,
        description,
        base_model_id: baseModelId,
        is_public: isPublic,
      }
    });
    
  } catch (error) {
    console.error('Model training error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Helper function to determine file type from file name
 */
function getFileType(filename: string): string {
  const lowercaseName = filename.toLowerCase();
  if (lowercaseName.endsWith('.jpg') || lowercaseName.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else if (lowercaseName.endsWith('.png')) {
    return 'image/png';
  } else if (lowercaseName.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'application/octet-stream';
} 