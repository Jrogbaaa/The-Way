import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    // Properly await params
    const { modelId } = await params;
    
    if (!modelId) {
      console.error('Model ID is missing');
      return NextResponse.json({ error: 'Model ID is missing' }, { status: 400 });
    }
    
    console.log('Fetching status for model ID:', modelId);
    
    // Get training status from the database
    const { data, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch model status' }, { status: 500 });
    }
    
    if (!data) {
      console.error('Model not found:', modelId);
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    console.log('Model status:', data.status);
    
    return NextResponse.json({
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      error: data.error_message,
      model_info: data.model_info,
      sample_image: data.sample_image,
    });
    
  } catch (error) {
    console.error('Error in GET /api/modal/model-status/[modelId]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 