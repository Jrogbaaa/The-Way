import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { execPromise } from '@/lib/server/utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Force update a Modal training job status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  console.log(`Force updating model status for: ${id}`);
  
  try {
    // Get current model data
    const { data: model, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    console.log(`Current model status: ${model.status}, age: ${Math.round((Date.now() - new Date(model.created_at).getTime()) / 1000 / 60)} minutes`);

    // Check if model exists in Modal volume
    let modelExistsInVolume = false;
    let modalCheckError = null;

    try {
      console.log('Checking if model exists in Modal volume...');
      const { stdout, stderr } = await execPromise('python3 -m modal run modal_scripts/list_models.py');
      
      if (stderr) {
        console.warn('Modal list models stderr:', stderr);
      }
      
      const models = JSON.parse(stdout.trim());
      modelExistsInVolume = models.some((m: any) => m.id === id);
      
      console.log(`Model ${id} exists in Modal volume: ${modelExistsInVolume}`);
      
    } catch (error) {
      console.error('Error checking Modal volume:', error);
      modalCheckError = error instanceof Error ? error.message : String(error);
    }

    // Calculate age in minutes
    const ageMinutes = (Date.now() - new Date(model.created_at).getTime()) / 1000 / 60;
    
    let newStatus = model.status;
    let newProgress = model.progress || 0;
    let errorMessage = model.error_message;
    const updateData: any = {};

    // Decision logic for status updates
    if (modelExistsInVolume) {
      // Model exists in volume - it's completed!
      console.log(`Model ${id} found in Modal volume, marking as completed`);
      newStatus = 'completed';
      newProgress = 100;
      updateData.status = newStatus;
      updateData.progress = newProgress;
      updateData.error_message = null;
      
      // Try to get model info
      try {
        const { stdout } = await execPromise(`python3 -m modal run modal_scripts/get_model_info.py --model-id ${id}`);
        const modelInfo = JSON.parse(stdout.trim());
        updateData.model_info = modelInfo;
      } catch (infoError) {
        console.warn('Could not get model info:', infoError);
      }
      
    } else if (ageMinutes > 60) {
      // Model doesn't exist and it's been over an hour - likely failed
      console.log(`Model ${id} not found in volume and age > 60 minutes, marking as failed`);
      newStatus = 'failed';
      newProgress = 0;
      errorMessage = `Training timed out after ${Math.round(ageMinutes)} minutes. ${modalCheckError ? `Modal check error: ${modalCheckError}` : ''}`;
      updateData.status = newStatus;
      updateData.progress = newProgress;
      updateData.error_message = errorMessage;
      
    } else if (ageMinutes > 30) {
      // Between 30-60 minutes - might still be training
      console.log(`Model ${id} age ${Math.round(ageMinutes)} minutes, setting to training status`);
      newStatus = 'training';
      newProgress = Math.round(Math.min(85, 50 + (ageMinutes - 15) * 2)); // Progressive increase, rounded
      updateData.status = newStatus;
      updateData.progress = newProgress;
      
    } else {
      // Less than 30 minutes - keep as is but update progress
      if (model.status === 'starting') {
        newProgress = Math.round(Math.min(30, 10 + ageMinutes * 0.5)); // Rounded to integer
        updateData.progress = newProgress;
      }
    }

    // Update database if changes were made
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('trained_models')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating model:', updateError);
        return NextResponse.json(
          { error: `Update failed: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log(`Successfully updated model ${id}:`, updateData);
    }

    return NextResponse.json({
      success: true,
      modelId: id,
      previousStatus: model.status,
      newStatus,
      newProgress,
      ageMinutes: Math.round(ageMinutes),
      modelExistsInVolume,
      updatesApplied: Object.keys(updateData),
      message: `Model status updated from ${model.status} to ${newStatus}`
    });

  } catch (error) {
    console.error('Error in force update:', error);
    return NextResponse.json(
      { error: `Force update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 