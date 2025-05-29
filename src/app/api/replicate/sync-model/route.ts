import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(request: NextRequest) {
  console.log('POST /api/replicate/sync-model called');
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { modelId, replicateTrainingId } = await request.json();
    
    if (!modelId || !replicateTrainingId) {
      return NextResponse.json(
        { error: 'Missing modelId or replicateTrainingId' },
        { status: 400 }
      );
    }

    console.log(`Syncing model ${modelId} with Replicate training ${replicateTrainingId}`);

    // Get training status from Replicate
    const training = await replicate.trainings.get(replicateTrainingId);
    console.log('Training status from Replicate:', training.status);

    let updateData: any = {
      replicate_training_id: replicateTrainingId,
      updated_at: new Date().toISOString()
    };

    if (training.status === 'succeeded') {
      updateData.status = 'completed';
      updateData.model_url = training.output?.model || `${process.env.REPLICATE_USERNAME}/${modelId}`;
    } else if (training.status === 'failed') {
      updateData.status = 'failed';
      updateData.error_message = training.error || 'Training failed';
    } else if (training.status === 'processing') {
      updateData.status = 'training';
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', modelId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error updating model:', updateError);
      return NextResponse.json(
        { error: `Database error: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: training.status,
      modelUrl: updateData.model_url,
      message: `Model ${modelId} synced successfully`
    });

  } catch (error: any) {
    console.error('Error syncing model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync model' },
      { status: 500 }
    );
  }
} 