import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
// Remove unused import if API_CONFIG is no longer needed for the token
// import { API_CONFIG } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';

// Initialize Replicate client using the environment variable directly
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const isConfigured = !!process.env.REPLICATE_API_TOKEN;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stable Portrait fine-tuning model
const TRAINER_MODEL = "stability-ai/sdxl-finetuner";
// Version is now optional according to Replicate's updated API

/**
 * Process and start model training with Replicate SDXL fine-tuner
 * Handles multipart form data with training images or a zip file
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/models/train called');
  
  if (!isConfigured) {
    console.error('Replicate API key not configured in POST /api/models/train');
    return NextResponse.json(
      { error: 'Server configuration error: Replicate API token missing' }, 
      { status: 500 }
    );
  }

  const webhookUrl = process.env.REPLICATE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('REPLICATE_WEBHOOK_URL is not configured.');
    return NextResponse.json(
      { error: 'Server configuration error: Webhook URL missing' }, 
      { status: 500 }
    );
  }

  try {
    const { userId, modelName, input, trainerVersion } = await request.json();
    console.log('Received training request:', { userId, modelName, inputKeys: Object.keys(input || {}), trainerVersion });

    if (!userId || !modelName || !input || !trainerVersion) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, modelName, input, trainerVersion' }, 
        { status: 400 }
      );
    }

    // Generate a unique ID for the model in the database
    const dbModelId = nanoid(); 
    console.log(`Generated DB Model ID: ${dbModelId}`);

    // Destination format: `username/modelname`
    const destination = `${userId.replace(/\W+/g, '-')}/${modelName.replace(/\W+/g, '-')}`;
    console.log(`Training destination: ${destination}`);

    // Insert placeholder into database *before* starting training
    const { error: insertError } = await supabase
      .from('trained_models')
      .insert({
        id: dbModelId, // Use generated nano id
        user_id: userId,
        model_name: modelName,
        status: 'starting', // Initial status
        version: trainerVersion, // Track trainer version used
        replicate_destination: destination, // Store the target replicate model path
        run_id: null, // Placeholder for Replicate run ID
        input_data: input, // Store input for reference
      });

    if (insertError) {
      console.error('Error inserting initial model record into Supabase:', insertError);
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` }, 
        { status: 500 }
      );
    }
    console.log(`Initial record inserted into DB for model ID: ${dbModelId}`);

    // Start the training job on Replicate
    console.log(`Starting Replicate training for ${destination} with version ${trainerVersion}`);
    const training = await replicate.trainings.create(
      'replicate', // owner
      'sdxl', // model name (could be dynamic if needed)
      trainerVersion, // specific trainer version
      {
        destination: destination as `${string}/${string}`, // Required: where the trained model is saved (type assertion)
        input: input, // Training data and parameters
        webhook: `${webhookUrl}?model_id=${dbModelId}&user_id=${userId}&secret=${process.env.REPLICATE_WEBHOOK_SECRET || ''}`, // Append our internal ID
        webhook_events_filter: ['start', 'output', 'logs', 'completed'] // Specify desired events
      }
    );
    
    console.log('Training started with Replicate ID:', training.id, training.status);

    // Check for immediate errors during creation
    if (training?.error) {
      console.error('Error starting training:', training.error);
      // Attempt to update the DB record to 'failed' status
      await supabase
        .from('trained_models')
        .update({ status: 'failed', error_message: training.error })
        .eq('id', dbModelId);
      return NextResponse.json({ detail: training.error }, { status: 500 });
    }

    // Update the database record with the Replicate training ID
    const { error: updateError } = await supabase
      .from('trained_models')
      .update({ run_id: training.id, status: training.status || 'starting' })
      .eq('id', dbModelId);

    if (updateError) {
      console.error('Error updating model record with Replicate ID:', updateError);
      // Log error but proceed, training is already started
    }
    console.log(`DB record updated with Replicate Run ID: ${training.id} for model ID: ${dbModelId}`);

    // Return the initial training object (including our DB ID)
    return NextResponse.json({ ...training, dbModelId }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/models/train:', error);
    const detail = error.response?.data?.detail || error.message || 'An unknown error occurred';
    const status = error.response?.status || 500;
    // Attempt to update status if we have a model ID (might fail if error was before db insertion)
    const modelIdFromBody = (await request.json()).dbModelId; // Re-parse to get ID if possible
    if (modelIdFromBody) {
        await supabase
            .from('trained_models')
            .update({ status: 'failed', error_message: detail })
            .eq('id', modelIdFromBody);
    }
    return NextResponse.json({ detail }, { status });
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