import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { nanoid } from 'nanoid';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// The trainer model we'll use (FLUX LoRA trainer)
const TRAINER_MODEL = "ostris/flux-dev-lora-trainer";

// Get Replicate username from environment
const REPLICATE_USERNAME = process.env.REPLICATE_USERNAME;

if (!REPLICATE_USERNAME) {
  console.error('REPLICATE_USERNAME environment variable is not set');
}

/**
 * POST /api/replicate/train
 * Creates a new model and trains it using Replicate's standard approach
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

    // Create a unique model name for this training (following Replicate's best practices)
    const sanitizedModelName = modelName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const sanitizedTrainingId = trainingId.toLowerCase().slice(0, 8);
    
    // Ensure model name doesn't start or end with invalid characters
    const cleanModelName = sanitizedModelName.replace(/^[-_.]+|[-_.]+$/g, '');
    const finalModelName = cleanModelName || 'model'; // fallback if name becomes empty
    
    const uniqueModelName = `${finalModelName}-${sanitizedTrainingId}`;
    const fullModelName = `${REPLICATE_USERNAME}/${uniqueModelName}`;
    
    console.log(`Creating unique model: ${fullModelName}`);

    // Create the model first (following Replicate's standard approach)
    try {
      await replicate.models.create(
        REPLICATE_USERNAME,
        uniqueModelName,
        {
          visibility: "private",
          hardware: "gpu-t4", // Replicate will override this for training
          description: `FLUX LoRA model: ${modelName} (trigger: ${triggerWord})`
        }
      );
      console.log('Model created successfully:', uniqueModelName);
    } catch (createError: any) {
      console.error('Error creating model:', createError);
      return NextResponse.json(
        { error: `Failed to create model: ${createError.message}` },
        { status: 500 }
      );
    }

    // Insert training record into database BEFORE starting training
    // Use service role client to bypass RLS policies for server-side operations
    const serviceRoleClient = createAdminClient();
    
    const { error: insertError } = await serviceRoleClient
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
          replicateModelName: fullModelName,
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
    const trainerModel = await replicate.models.get("ostris", "flux-dev-lora-trainer");
    const latestVersion = trainerModel.latest_version;
    
    if (!latestVersion) {
      throw new Error('Could not find latest version of flux trainer');
    }
    
    console.log(`Using trainer version: ${latestVersion.id}`);
    
    // Create training with the unique model as destination
    const trainingInput: any = {
      destination: fullModelName, // Use the unique model as destination
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
    console.log('This will create the trained model:', fullModelName);

    // Update database with Replicate training ID
    const { error: updateError } = await serviceRoleClient
      .from('trained_models')
      .update({ 
        replicate_id: training.id,
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
      modelName: fullModelName,
      status: training.status,
      message: 'Training started successfully - creating new trained model'
    });

  } catch (error: any) {
    console.error('Error starting training:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start training' },
      { status: 500 }
    );
  }
} 