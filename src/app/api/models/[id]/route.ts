import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Wait for params to be resolved
    const { id } = await params;

    // Get the model from the database
    const { data: model, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // Return the model information with proper field mapping
    return NextResponse.json({
      id: model.id,
      model_name: model.model_name,
      status: model.status,
      progress: model.progress || 0,
      created_at: model.created_at,
      updated_at: model.updated_at,
      user_id: model.user_id,
      model_info: model.model_info,
      input_data: model.input_data,
      error_message: model.error_message,
      last_update: model.updated_at,
      model_url: model.model_url, // Replicate model URL for generation
      replicate_id: model.replicate_id, // Replicate training/model ID
      sample_image: model.sample_image
    });

  } catch (error: any) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch model' },
      { status: 500 }
    );
  }
} 