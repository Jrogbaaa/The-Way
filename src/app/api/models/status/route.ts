import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
// Remove unused import if API_CONFIG is no longer needed for the token
// import { API_CONFIG } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Use environment variable directly
});

// Check configuration directly from the environment variable
const isConfigured = !!process.env.REPLICATE_API_TOKEN;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API Route: GET /api/models/status
 * Fetches the status of a Replicate prediction.
 * 
 * Expects a `predictionId` query parameter.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get('predictionId');

  console.log(`GET /api/models/status called for prediction ID: ${predictionId}`);

  if (!isConfigured) {
    console.error('Replicate API key not configured in GET /api/models/status');
    return NextResponse.json(
      { error: 'Server configuration error: Replicate API token missing' }, 
      { status: 500 }
    );
  }

  if (!predictionId) {
    return NextResponse.json({ error: 'Missing predictionId parameter' }, { status: 400 });
  }

  try {
    console.log(`Fetching status for prediction: ${predictionId}`);
    // Fetch the prediction status from Replicate
    const prediction = await replicate.predictions.get(predictionId);
    
    console.log(`Prediction status for ${predictionId}: ${prediction.status}`);

    // If training completed successfully but we didn't get a webhook (likely in local dev),
    // save the model data
    if (prediction.status === 'succeeded' && 
        prediction.version && 
        prediction.version.includes('flux-dev-lora-trainer') &&
        prediction.output?.model) {
      
      console.log('Training completed and detected during status check');
      
      // Extract model info
      const trainedModelUrl = prediction.output.model;
      const trainedModelVersion = prediction.output.version;
      
      try {
        // Check if model is already saved in the database
        const { data: existingModel } = await supabase
          .from('trained_models')
          .select('id')
          .eq('id', predictionId)
          .single();
          
        if (!existingModel) {
          console.log('Saving model data from status endpoint');
          
          // Structure model data for database
          const modelData = {
            id: prediction.id,
            name: (prediction.input as any)?.name || 'Custom LoRA Model',
            description: (prediction.input as any)?.model_description || 'Custom trained LoRA model',
            version: trainedModelVersion,
            model_url: trainedModelUrl,
            status: 'ready',
            created_at: prediction.created_at,
            keyword: (prediction.input as any)?.caption_prefix || (prediction.input as any)?.name,
            input_parameters: prediction.input || {},
            category: 'Custom',
            is_public: false,
          };
          
          // Save to Supabase
          const { error } = await supabase
            .from('trained_models')
            .upsert(modelData, { onConflict: 'id' });
            
          if (error) {
            console.error('Database error when saving model:', error);
          } else {
            console.log('Model saved to database from status endpoint');
          }
        }
      } catch (saveError) {
        console.error('Error saving model data:', saveError);
      }
    }
    
    // Return the relevant prediction details (status, output, error)
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs // Include logs for debugging if needed
    });

  } catch (error: any) {
    console.error(`Error fetching status for prediction ${predictionId}:`, error);
    const detail = error.response?.data?.detail || error.message || 'An unknown error occurred';
    const status = error.response?.status || 500;
    return NextResponse.json({ detail, error: `Failed to get prediction status` }, { status });
  }
} 