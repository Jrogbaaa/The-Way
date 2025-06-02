import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { auth } from '@/auth';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The trainer model we'll use (FLUX LoRA trainer)
const TRAINER_MODEL = "ostris/flux-dev-lora-trainer";

// Get Replicate username from environment
const REPLICATE_USERNAME = process.env.REPLICATE_USERNAME;

if (!REPLICATE_USERNAME) {
  console.error('REPLICATE_USERNAME environment variable is not set');
}

// Base model name that all trainings will use as versions
const BASE_MODEL_NAME = "flux-lora-base";

/**
 * Ensure the base model exists, create it if it doesn't
 */
async function ensureBaseModelExists(): Promise<void> {
  if (!REPLICATE_USERNAME) {
    throw new Error('REPLICATE_USERNAME not configured');
  }

  try {
    // Try to get the base model first
    await replicate.models.get(REPLICATE_USERNAME, BASE_MODEL_NAME);
    console.log('Base model already exists');
  } catch (error: any) {
    if (error.status === 404) {
      // Model doesn't exist, create it
      console.log('Creating base model for all trainings...');
      await replicate.models.create(REPLICATE_USERNAME, BASE_MODEL_NAME, {
        visibility: "private",
        hardware: "gpu-t4",
        description: "Base model for FLUX LoRA fine-tuning. Each training creates a new version of this model."
      });
      console.log('Base model created successfully');
    } else {
      throw error;
    }
  }
}

/**
 * POST /api/replicate/train
 * Creates a new model version using Replicate's recommended approach
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/replicate/train called');
  
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API token not configured' }, 
      { status: 500 }
    );
  }

  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    let { modelName, instancePrompt, trainingImagesZipUrl, triggerWord, tempId } = requestBody;
    
    // If tempId is provided, retrieve the configuration from temporary storage
    if (tempId) {
      try {
        console.log(`Retrieving temporary training config for ID: ${tempId}`);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/training/prepare/${tempId}`, {
          method: 'GET'
        });
        
        if (response.ok) {
          const tempData = await response.json();
          if (tempData.success && tempData.config) {
            console.log('Successfully retrieved configuration from temporary storage');
            modelName = tempData.config.modelName;
            instancePrompt = tempData.config.instancePrompt;
            trainingImagesZipUrl = tempData.config.trainingImagesZipUrl;
            triggerWord = tempData.config.triggerWord;
          } else {
            console.warn('Temporary config response was not successful:', tempData);
          }
        } else {
          console.warn(`Failed to retrieve temporary config: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.warn('Error retrieving temporary config:', error);
        // Don't fail the entire request, just log the warning
      }
    }
    
    // Validate required parameters
    if (!modelName || !instancePrompt || !trainingImagesZipUrl || !triggerWord) {
      return NextResponse.json(
        { error: 'Missing required parameters: modelName, instancePrompt, trainingImagesZipUrl, triggerWord' }, 
        { status: 400 }
      );
    }

    // Generate unique training ID
    const trainingId = nanoid();
    
    console.log(`Starting Replicate training for user ${session.user.id}, model: ${modelName}`);

    // Check if we have a valid Replicate username
    if (!REPLICATE_USERNAME) {
      return NextResponse.json(
        { error: 'Replicate username not configured. Please set REPLICATE_USERNAME environment variable.' },
        { status: 500 }
      );
    }

    // Ensure base model exists
    await ensureBaseModelExists();

    // Insert training record into database BEFORE starting training
    const { error: insertError } = await supabase
      .from('trained_models')
      .insert({
        id: trainingId,
        user_id: session.user.id,
        model_name: modelName,
        status: 'starting',
        created_at: new Date().toISOString(),
        input_data: {
          instancePrompt,
          triggerWord,
          trainingImagesZipUrl,
          originalModelName: modelName,
          baseModelName: BASE_MODEL_NAME,
          replicateModelName: `${REPLICATE_USERNAME}/${BASE_MODEL_NAME}`,
          // Store if this came from temporary storage
          fromTempConfig: !!tempId
        }
      });

    if (insertError) {
      console.error('Error inserting training record:', insertError);
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` }, 
        { status: 500 }
      );
    }

    // Start the training on Replicate
    // First, let's get the latest version of the trainer model
    console.log('Getting latest version of flux trainer...');
    const model = await replicate.models.get("ostris", "flux-dev-lora-trainer");
    const latestVersion = model.latest_version;
    
    if (!latestVersion) {
      throw new Error('Could not find latest version of flux trainer');
    }
    
    console.log(`Using trainer version: ${latestVersion.id}`);
    
    // Create training with base model as destination (creates new version)
    const trainingInput: any = {
      destination: `${REPLICATE_USERNAME}/${BASE_MODEL_NAME}`, // Use base model - this creates a new version
      input: {
        input_images: trainingImagesZipUrl,
        trigger_word: triggerWord,
        steps: 1000,
        lora_rank: 16,
        optimizer: "adamw8bit",
        batch_size: 1,
        resolution: "512,768,1024",
        autocaption: true,
        learning_rate: 0.0004
      }
    };
    
    // Only add webhook if we have a valid HTTPS URL (production)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (baseUrl.startsWith('https://')) {
      trainingInput.webhook = `${baseUrl}/api/webhooks/replicate`;
      console.log('Adding webhook URL:', trainingInput.webhook);
    } else {
      console.log('Skipping webhook in development (localhost)');
    }
    
    const training = await replicate.trainings.create(
      "ostris", // owner of the trainer model
      "flux-dev-lora-trainer", // trainer model name
      latestVersion.id, // Latest version ID from API
      trainingInput
    );

    console.log('Training started:', training.id);
    console.log('This will create a new version of the base model instead of a new individual model');

    // Update database with Replicate training ID
    const { error: updateError } = await supabase
      .from('trained_models')
      .update({ 
        replicate_training_id: training.id,
        status: training.status || 'starting'
      })
      .eq('id', trainingId);

    if (updateError) {
      console.error('Error updating training record:', updateError);
    }

    return NextResponse.json({
      success: true,
      trainingId,
      replicateTrainingId: training.id,
      modelName: `${REPLICATE_USERNAME}/${BASE_MODEL_NAME}`,
      baseModel: true, // Indicate this uses the base model approach
      status: training.status,
      message: 'Training started successfully - this will create a new version of the base model'
    });

  } catch (error: any) {
    console.error('Error starting training:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start training' },
      { status: 500 }
    );
  }
} 