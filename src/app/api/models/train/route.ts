import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';
import JSZip from 'jszip';

// Initialize Replicate client
const replicate = new Replicate({
  auth: API_CONFIG.replicateApiToken,
});

// Stable Portrait fine-tuning model
const TRAINER_MODEL = "stability-ai/sdxl-finetuner";
// Version is now optional according to Replicate's updated API

/**
 * Process and start model training with Replicate SDXL fine-tuner
 * Handles multipart form data with training images or a zip file
 */
export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    console.log('Received form data for model training');
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const baseModelId = formData.get('base_model_id') as string;
    const isPublic = (formData.get('is_public') as string) === 'true';
    const parametersJson = formData.get('parameters') as string;
    const parameters = JSON.parse(parametersJson);
    const keyword = formData.get('keyword') as string; // Get keyword for model
    
    // Get all the training images
    let trainingImages: File[] = [];
    const formFiles = formData.getAll('training_data') as File[];
    
    console.log(`Received ${formFiles.length} files for processing`);
    
    // Log file types for debugging
    formFiles.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    });
    
    if (formFiles.length === 0) {
      return NextResponse.json(
        { error: 'No training files were uploaded. Please upload training images or a zip file.' },
        { status: 400 }
      );
    }
    
    // Check if we have a zip file
    const zipFile = formFiles.find(file => file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip'));
    
    if (zipFile) {
      console.log('Zip file detected, extracting images...');
      // Extract images from the zip file
      const zipBuffer = await zipFile.arrayBuffer();
      const zip = new JSZip();
      
      try {
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
        
        if (trainingImages.length === 0) {
          return NextResponse.json(
            { error: 'No valid images found in the uploaded zip file. Please ensure your zip contains JPG, PNG, or WebP images.' },
            { status: 400 }
          );
        }
      } catch (zipError) {
        console.error('Error processing zip file:', zipError);
        return NextResponse.json(
          { error: 'Failed to process the uploaded zip file. The file may be corrupted or in an unsupported format.' },
          { status: 400 }
        );
      }
    } else {
      // Use individual image files
      trainingImages = formFiles.filter(file => 
        file.type === 'image/jpeg' || 
        file.type === 'image/png' || 
        file.type === 'image/webp'
      );
      
      console.log(`Found ${trainingImages.length} individual image files`);
    }
    
    if (!name) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required to identify your model in prompts' },
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
    
    // Construct the input parameters for the SDXL finetuner
    const trainingInput = {
      // Training images
      images: uploadedImages,
      
      // Basic parameters
      caption: keyword, // Use the provided keyword as caption prefix
      seed: Math.floor(Math.random() * 1000000),
      
      // Training parameters - using appropriate defaults for portrait training
      num_steps: parameters.num_train_epochs ? parameters.num_train_epochs * 500 : 1500,
      learning_rate: parameters.learning_rate || 1e-5,
      batch_size: parameters.train_batch_size || 4,
      
      // For portrait photos, these are good parameter values
      resolution: 1024,
      
      // Metadata and identification
      input_name: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      
      // Type of training (portrait mode is best for people)
      mode: "portrait",
    };
    
    console.log('Creating training job with parameters:', trainingInput);
    
    // Create the training prediction
    try {
      console.log('Creating training prediction with model:', TRAINER_MODEL);
      
      // Use direct API call instead of client
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_CONFIG.replicateApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Known working SDXL trainer version
          version: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
          input: trainingInput,
          webhook: process.env.REPLICATE_WEBHOOK_URL && isValidHttpsUrl(process.env.REPLICATE_WEBHOOK_URL) 
            ? process.env.REPLICATE_WEBHOOK_URL 
            : undefined,
          webhook_events_filter: ["completed"]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', {
          status: response.status,
          data: JSON.stringify(errorData)
        });
        
        return NextResponse.json(
          { 
            error: `API error: ${JSON.stringify(errorData)}`,
            details: "There was a problem creating the model with Replicate."
          },
          { status: response.status }
        );
      }
      
      const prediction = await response.json();
      
      console.log('Training job created:', prediction.id);
      
      // Return the prediction ID and status to the client
      return NextResponse.json({
        id: prediction.id,
        status: prediction.status,
        created_at: prediction.created_at,
        model: {
          name,
          description,
          keyword: keyword, // Use keyword instead of base_model_id
          is_public: isPublic,
        }
      });
    } catch (error: any) {
      console.error('Error creating training prediction:', error);
      
      // Provide more detailed error information
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Unknown error occurred during model training';
        
      return NextResponse.json(
        { 
          error: errorMessage,
          details: "There was a problem creating the model with Replicate. Please check your API credentials and try again."
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Model training error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate HTTPS URL
 */
function isValidHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:';
  } catch (e) {
    return false;
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

/**
 * Calculate 16:9 width for a given height resolution
 */
function getWidthForResolution(height: number): number {
  // Apply 16:9 aspect ratio
  return Math.floor(height * (16/9));
} 