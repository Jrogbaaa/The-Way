import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if credentials are available
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Endpoint for training progress updates from Modal
 */
export async function POST(req: NextRequest) {
  console.log('Training progress update received from Modal');
  
  if (!supabase) {
    console.error('Supabase client not initialized - cannot update training progress');
    return NextResponse.json(
      { success: false, error: 'Database connection not available' },
      { status: 500 }
    );
  }
  
  try {
    // Parse the request body
    const body = await req.json();
    
    // Log the entire payload for debugging
    console.log('Received payload:', JSON.stringify(body));
    
    const { modelId, status, progress, error, model_info, sample_image } = body;
    
    if (!modelId) {
      console.error('No model ID provided in training progress update');
      return NextResponse.json(
        { success: false, error: 'Model ID is required' },
        { status: 400 }
      );
    }
    
    // Check for stalled models and mark them as failed
    await detectAndMarkStalledModels();
    
    console.log(`Processing training update for model ${modelId}: ${status}`);
    
    // Prepare the data for update - ONLY include fields from the trained_models schema
    const updateData: Record<string, any> = {};
    
    // Only add fields that are provided and match the schema
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (progress !== undefined) {
      // Ensure progress is a valid number between 0 and 1
      let progressValue = parseFloat(progress);
      if (!isNaN(progressValue)) {
        // Cap progress between 0 and 1
        progressValue = Math.max(0, Math.min(1, progressValue));
        updateData.progress = progressValue;
      }
    }
    
    if (error !== undefined) {
      // Ensure error message is not too long for the database
      updateData.error_message = typeof error === 'string' 
        ? error.substring(0, 1000) // Limit length to 1000 chars
        : String(error).substring(0, 1000);
    }
    
    if (model_info !== undefined) {
      try {
        // Validate model_info is serializable JSON
        JSON.stringify(model_info);
        updateData.model_info = model_info;
      } catch (e) {
        console.error('Invalid model_info - not JSON serializable:', e);
        // Try to create a sanitized version
        if (typeof model_info === 'object' && model_info !== null) {
          const sanitized: Record<string, any> = {};
          for (const [key, value] of Object.entries(model_info)) {
            // Skip null values
            if (value === null) continue;
            
            // Skip NaN or Infinity
            if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) continue;
            
            // Convert unserializable values to strings
            try {
              JSON.stringify(value);
              sanitized[key] = value;
            } catch {
              sanitized[key] = String(value);
            }
          }
          updateData.model_info = sanitized;
        }
      }
    }
    
    if (sample_image !== undefined && typeof sample_image === 'string') {
      updateData.sample_image = sample_image;
    }
    
    // If status is completed, ensure progress is 1.0
    if (status === 'completed' && progress === undefined) {
      updateData.progress = 1.0;
    }
    
    // Log the sanitized update data
    console.log(`Sanitized update data keys: ${Object.keys(updateData).join(', ')}`);
    console.log(`Full update payload: ${JSON.stringify(updateData)}`);
    
    // Update the training record in Supabase
    const updateResult = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', modelId);
    
    const updateError = updateResult.error;
    
    if (updateError) {
      console.error('Error updating training record:', updateError);
      console.error('Error details:', JSON.stringify(updateError));
      
      // If we get a 400 error, try updating fields one by one
      if (updateError.code === '400' || updateError.code === 400 || updateError.status === 400) {
        console.log('Got 400 error, attempting to update fields individually...');
        
        // Try just updating the status first
        if (updateData.status) {
          const statusResult = await supabase
            .from('trained_models')
            .update({ status: updateData.status })
            .eq('id', modelId);
          
          console.log(`Status-only update result: ${JSON.stringify(statusResult)}`);
          
          // If that succeeds, try each remaining field one by one
          if (!statusResult.error) {
            for (const [key, value] of Object.entries(updateData)) {
              if (key === 'status') continue; // Skip status as we already updated it
              
              const singleFieldResult = await supabase
                .from('trained_models')
                .update({ [key]: value })
                .eq('id', modelId);
              
              console.log(`Field '${key}' update result: ${JSON.stringify(singleFieldResult)}`);
            }
          }
        }
      }
      
      return NextResponse.json(
        { success: false, error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Successfully updated training status for model ${modelId} to ${status}`);
    return NextResponse.json(
      { success: true, message: `Training status updated to ${status}` },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error in training progress update endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Function to detect and mark stalled models as failed
 * A model is considered stalled if it has been in 'pending' or 'starting' status
 * for more than 30 minutes based on its creation timestamp
 */
async function detectAndMarkStalledModels() {
  if (!supabase) return;
  
  try {
    console.log('Checking for stalled model trainings...');
    
    // Calculate the timestamp from 30 minutes ago
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    const cutoffTime = thirtyMinutesAgo.toISOString();
    
    // Query for models that have been in pending/starting status for more than 30 minutes
    // based on their created_at timestamp
    const { data: stalledModels, error } = await supabase
      .from('trained_models')
      .select('id, status, created_at')
      .lte('created_at', cutoffTime)
      .in('status', ['pending', 'starting', 'preprocessing']);
    
    if (error) {
      console.error('Error checking for stalled models:', error);
      return;
    }
    
    if (stalledModels && stalledModels.length > 0) {
      console.log(`Found ${stalledModels.length} stalled model trainings`);
      
      // Update each stalled model
      for (const model of stalledModels) {
        const errorMessage = `Training appears to be stalled. No updates received in over 30 minutes while in '${model.status}' status.`;
        console.log(`Marking model ${model.id} as failed: ${errorMessage}`);
        
        const updateResult = await supabase
          .from('trained_models')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', model.id);
        
        if (updateResult.error) {
          console.error(`Failed to update stalled model ${model.id}:`, updateResult.error);
        } else {
          console.log(`Successfully marked stalled model ${model.id} as failed`);
        }
      }
    } else {
      console.log('No stalled model trainings found');
    }
  } catch (e) {
    console.error('Error in detectAndMarkStalledModels:', e);
  }
} 