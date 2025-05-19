import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Reset a failed training job to allow restarting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }
    
    // Get current status
    const { data: currentState, error: fetchError } = await supabase
      .from('trained_models')
      .select('status, error_message')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error(`Error fetching model ${id}:`, fetchError);
      return NextResponse.json(
        { error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    if (!currentState) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Only allow resetting of error/failed states
    if (currentState.status !== 'error' && !currentState.error_message) {
      return NextResponse.json(
        { error: 'Only failed training jobs can be reset' },
        { status: 400 }
      );
    }
    
    // Update model status to reset
    const { data, error } = await supabase
      .from('trained_models')
      .update({
        status: 'pending',
        error_message: null,
        progress: 0,
        last_update: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error resetting model ${id}:`, error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true,
        data
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reset training API:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 