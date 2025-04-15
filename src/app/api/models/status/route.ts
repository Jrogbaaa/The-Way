import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Replicate client
const replicate = new Replicate({
  auth: API_CONFIG.replicateApiToken,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get the prediction ID from the query string
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 });
    }
    
    console.log(`Checking status for prediction ${id}`);
    
    // Get prediction status from Replicate
    const prediction = await replicate.predictions.get(id);
    
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
          .eq('id', id)
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
    
    // Return the prediction status
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
      completed_at: prediction.completed_at,
      output: prediction.output,
      error: prediction.error,
    });
    
  } catch (error) {
    console.error('Error checking prediction status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 