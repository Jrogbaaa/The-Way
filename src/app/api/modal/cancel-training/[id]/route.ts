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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    
    console.log(`Attempting to cancel training for ID: ${id}`);
    
    if (!id) {
      return NextResponse.json({ status: 'error', error: 'Training ID is required' }, { status: 400 });
    }
    
    // Get training info from database
    const { data: trainingData, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error(`Error fetching training data: ${fetchError.message}`);
      return NextResponse.json({ status: 'error', error: 'Training job not found' }, { status: 404 });
    }
    
    // Only allow cancellation of running jobs
    if (!['pending', 'starting', 'training'].includes(trainingData.status)) {
      return NextResponse.json(
        { status: 'error', error: `Training is already in status "${trainingData.status}" and cannot be cancelled` }, 
        { status: 400 }
      );
    }
    
    // Try to cancel Modal job
    try {
      // This is an optional step, as Modal doesn't directly expose a way to cancel a job from outside
      // We're just trying to stop the Modal process if it's running locally
      await execPromise('python3 -m modal app stop custom-image-model-trainer');
    } catch (modalError) {
      console.warn('Unable to stop Modal app, will proceed with database update anyway:', modalError);
    }
    
    // Update database record
    const { error: updateError } = await supabase
      .from('trained_models')
      .update({
        status: 'cancelled',
        error_message: 'Training cancelled by user',
      })
      .eq('id', id);
    
    if (updateError) {
      console.error(`Error updating training status: ${updateError.message}`);
      return NextResponse.json(
        { status: 'error', error: 'Failed to update training status' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Training job cancelled successfully',
    });
    
  } catch (error) {
    console.error('Error in cancel-training:', error);
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 