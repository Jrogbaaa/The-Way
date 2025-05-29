import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
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

/**
 * GET /api/replicate/status/[id]
 * Check the status of a Replicate training job and update database
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  console.log(`GET /api/replicate/status/${params.id} called`);
  
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

    const trainingId = params.id;

    // First, get the training record from our database
    const { data: dbRecord, error: dbError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', trainingId)
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !dbRecord) {
      return NextResponse.json(
        { error: 'Training record not found' },
        { status: 404 }
      );
    }

    // If we don't have a Replicate training ID, return the current database status
    if (!dbRecord.replicate_training_id) {
      return NextResponse.json({
        id: trainingId,
        status: dbRecord.status,
        progress: dbRecord.progress || 0,
        error: dbRecord.error_message
      });
    }

    // Check status with Replicate
    const training = await replicate.trainings.get(dbRecord.replicate_training_id);
    
    console.log(`Replicate training ${training.id} status: ${training.status}`);

    // Update our database with the latest status
    let updateData: any = {
      status: training.status,
      updated_at: new Date().toISOString()
    };

    // If training completed successfully, we need to get the model version
    if (training.status === 'succeeded' && training.output) {
      updateData.replicate_model_version = training.output.version;
      updateData.model_url = training.output.version; // The version ID can be used to run the model
      updateData.progress = 100;
      
      // Store additional output data if available
      if (training.output.weights) {
        updateData.weights_url = training.output.weights;
      }
    } else if (training.status === 'failed') {
      updateData.error_message = training.error || 'Training failed';
      updateData.progress = 0;
    } else if (training.status === 'processing') {
      // Estimate progress based on logs or other indicators
      // This is a rough estimate - you might want to parse logs for more accurate progress
      updateData.progress = 50;
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', trainingId);

    if (updateError) {
      console.error('Error updating training status in database:', updateError);
    }

    return NextResponse.json({
      id: trainingId,
      replicateId: training.id,
      status: training.status,
      progress: updateData.progress || 0,
      error: training.error,
      output: training.output,
      logs: training.logs,
      modelVersion: training.output?.version
    });

  } catch (error: any) {
    console.error('Error checking training status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check training status' },
      { status: 500 }
    );
  }
} 