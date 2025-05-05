import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProgressUpdate {
  trainingId: string;
  progress: number;
  message?: string;
  step?: number;
  totalSteps?: number;
}

export async function POST(req: NextRequest) {
  console.log('POST /api/modal/training-progress received');
  
  try {
    const body = await req.json() as ProgressUpdate;
    const { trainingId, progress, message, step, totalSteps } = body;
    
    if (!trainingId) {
      console.error('Missing training ID in progress update');
      return NextResponse.json(
        { error: 'Missing training ID' },
        { status: 400 }
      );
    }
    
    console.log(`Updating training progress for model ${trainingId}: ${progress}%`);
    
    // Update the training record in the database
    const { error } = await supabase
      .from('trained_models')
      .update({
        progress,
        status: progress >= 100 ? 'completed' : 'training',
      })
      .eq('id', trainingId);
    
    if (error) {
      console.error('Error updating training progress:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in POST /api/modal/training-progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 