import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { execPromise } from '@/lib/server/utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Maximum training time in minutes before considering it timed out
const MAX_TRAINING_TIME_MINUTES = 60; // 1 hour

// Helper function to ensure consistent error responses
const createErrorResponse = (message: string, status: number = 500, details?: any) => {
  console.error(`API Error (${status}): ${message}`, details ? details : '');
  return NextResponse.json(
    { 
      status: 'error', 
      error: message,
      error_message: details || message 
    }, 
    { status }
  );
};

// Helper function to check if a model exists in the Modal volume
const checkModelInVolume = async (modelId: string): Promise<boolean> => {
  try {
    const { stdout } = await execPromise('python3 -m modal run modal_scripts/list_models.py');
    const models = JSON.parse(stdout.trim());
    return models.some((model: any) => model.id === modelId);
  } catch (error) {
    console.error(`Error checking model in volume: ${error}`);
    return false;
  }
};

export async function GET(
  request: NextRequest, 
  context: { params: { id: string } } // Keep context for Next.js to correctly identify it as a dynamic route
) {
  try {
    // Alternative way to get the dynamic path parameter `id`
    const pathnameParts = request.nextUrl.pathname.split('/');
    const id = pathnameParts[pathnameParts.length - 1];
    
    if (!id) {
      return createErrorResponse('Missing model ID from path', 400);
    }
    
    console.log(`Fetching model status for (from pathname): ${id}`);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const forceCheck = searchParams.get('force') === 'true';
    
    // If no Supabase configured, return a mock response for development
    if (!supabase) {
      return NextResponse.json({
        id,
        status: 'completed',
        progress: 1.0,
        model_name: `Mock Model ${id}`,
        created_at: new Date().toISOString(),
        message: 'Mock data - Supabase not configured'
      });
    }
    
    // Get the training data from the database
    let { data: trainingData, error: queryError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (queryError) {
      console.error(`Database error fetching model: ${queryError.message}`);
      return createErrorResponse('Failed to fetch model from database', 500, queryError.message);
    }
    
    if (!trainingData) {
      return createErrorResponse('Model not found', 404);
    }
    
    console.log(`Found model in database: ${id}, status: ${trainingData.status}`);
    
    // Get current status information
    let status = trainingData.status || 'pending';
    let progress = trainingData.progress || 0;
    let needsUpdate = false;
    let statusChanged = false;
    let timeoutDetected = false;
    
    // Prepare data for potential update
    const updateData: any = {};
    
    // Check for timed-out training jobs (longer than MAX_TRAINING_TIME_MINUTES)
    const createdAtTime = new Date(trainingData.created_at).getTime();
    const currentTime = Date.now();
    const trainingTimeMinutes = (currentTime - createdAtTime) / (1000 * 60);
    
    console.log(`Training job age: ${trainingTimeMinutes.toFixed(1)} minutes`);
    
    // Only check for timeouts if the job isn't already in a terminal state
    if (status !== 'completed' && status !== 'failed' && trainingTimeMinutes > MAX_TRAINING_TIME_MINUTES) {
      console.log(`Training job ${id} has exceeded max training time (${MAX_TRAINING_TIME_MINUTES} minutes), marking as failed`);
      
      status = 'failed';
      updateData.status = status;
      updateData.error_message = `Training timed out after ${trainingTimeMinutes.toFixed(0)} minutes`;
      timeoutDetected = true;
      needsUpdate = true;
      statusChanged = true;
    }
    
    // If the model is marked as completed, verify it actually exists in the Modal volume
    if ((status === 'completed' || status === 'success') && forceCheck) {
      console.log(`Verifying model ${id} actually exists in Modal volume`);
      const exists = await checkModelInVolume(id);
      
      if (!exists) {
        console.log(`Model ${id} not found in Modal volume, marking as failed`);
        status = 'failed';
        updateData.status = status;
        updateData.error_message = 'Model files not found in storage. The model may have been deleted or failed to train properly.';
        needsUpdate = true;
        statusChanged = true;
      }
    }
    
    // If model was in a terminal state, use that state
    if (status === 'completed' || status === 'failed') {
      // Nothing to do, we keep the terminal state
    }
    // Handle 'success' status - convert it to 'completed'
    else if (status === 'success') {
      status = 'completed';
      updateData.status = status;
      needsUpdate = true;
    }
    // Handle training jobs that should be completed
    else if (forceCheck || (trainingData.model_info && !timeoutDetected)) {
      console.log(`Training job ${id} appears complete (model_info exists). Marking as completed.`);
      status = 'completed';
      progress = 1.0;
      updateData.status = status;
      updateData.progress = progress;
      needsUpdate = true;
      statusChanged = true;
    }
    
    // Update the database if needed
    if (needsUpdate) {
      try {
        const { error: updateError } = await supabase
          .from('trained_models')
          .update(updateData)
          .eq('id', id);
          
        if (updateError) {
          console.error(`Error updating training status: ${updateError.message}`);
        } else {
          console.log(`Successfully updated training job ${id} status to ${status}`);
          if (statusChanged) {
            // Update the training data with our changes
            trainingData = { ...trainingData, ...updateData };
          }
        }
      } catch (updateError) {
        console.error('Error updating training status:', updateError);
      }
    }
    
    // Prepare the response
    const response = NextResponse.json({
      id: trainingData.id,
      status: status,
      progress: progress,
      model_name: trainingData.model_name,
      model_info: trainingData.model_info,
      created_at: trainingData.created_at,
      error_message: trainingData.error_message,
      input_data: trainingData.input_data,
      sample_image: trainingData.sample_image,
      model_url: trainingData.model_url,
      last_update: trainingData.updated_at
    });
    
    // Set cache headers to prevent caching of status updates
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Error fetching model status:', error);
    return createErrorResponse('Server error', 500, 
      error instanceof Error ? error.message : 'Unknown error');
  }
} 