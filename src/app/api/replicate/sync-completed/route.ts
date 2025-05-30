import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { auth } from '@/auth';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Manually sync a completed Replicate model
 */
export async function POST(request: NextRequest) {
  try {
    const { modelId, replicateModelVersion } = await request.json();
    
    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    console.log(`Syncing completed Replicate model: ${modelId}`);

    // Get current model from database
    const { data: model, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (fetchError || !model) {
      return NextResponse.json(
        { error: 'Model not found in database' },
        { status: 404 }
      );
    }

    // Extract Replicate model info from input_data
    const inputData = model.input_data || {};
    const replicateModelName = inputData.replicateModelName || inputData.sanitizedModelName;
    
    if (!replicateModelName) {
      return NextResponse.json(
        { error: 'No Replicate model name found in model data' },
        { status: 400 }
      );
    }

    console.log(`Checking Replicate model: ${replicateModelName}`);

    // Get the model versions from Replicate
    let modelVersion = replicateModelVersion;
    if (!modelVersion) {
      try {
        const replicateModel = await replicate.models.get(replicateModelName.split('/')[0], replicateModelName.split('/')[1]);
        modelVersion = replicateModel.latest_version?.id;
      } catch (replicateError) {
        console.error('Error fetching from Replicate:', replicateError);
        return NextResponse.json(
          { error: `Could not fetch model from Replicate: ${replicateError}` },
          { status: 500 }
        );
      }
    }

    if (!modelVersion) {
      return NextResponse.json(
        { error: 'No model version found' },
        { status: 404 }
      );
    }

    // Update the database with completion data
    const updateData = {
      status: 'completed',
      progress: 100,
      model_url: `${replicateModelName}:${modelVersion}`,
      version: modelVersion,
      updated_at: new Date().toISOString(),
      model_info: {
        modelVersion,
        replicateModelName,
        completedAt: new Date().toISOString(),
        manuallysynced: true
      }
    };

    const { error: updateError } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', modelId);

    if (updateError) {
      console.error('Error updating model:', updateError);
      return NextResponse.json(
        { error: `Failed to update model: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully synced model ${modelId} with Replicate version ${modelVersion}`);

    return NextResponse.json({
      success: true,
      modelId,
      replicateModelName,
      modelVersion,
      modelUrl: `${replicateModelName}:${modelVersion}`,
      message: 'Model successfully synced as completed'
    });

  } catch (error) {
    console.error('Error in sync completed:', error);
    return NextResponse.json(
      { error: `Sync failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 