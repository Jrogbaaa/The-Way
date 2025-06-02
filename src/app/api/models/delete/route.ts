import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest) {
  console.log('DELETE /api/models/delete called');

  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // First, verify the model exists and belongs to the user
    const { data: model, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (fetchError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // Check if the model belongs to the current user
    // Support both authenticated users and legacy anonymous models
    const userEmail = session.user.email;
    const canDelete = 
      model.user_id === session.user.id || 
      (model.user_id === 'anonymous' && userEmail === '11jellis@gmail.com'); // Allow cleanup of legacy anonymous models

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You can only delete your own models' },
        { status: 403 }
      );
    }

    // Delete the model
    const { error: deleteError } = await supabase
      .from('trained_models')
      .delete()
      .eq('id', modelId);

    if (deleteError) {
      console.error('Error deleting model:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete model' },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted model: ${modelId} (${model.model_name})`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted model: ${model.model_name}`,
      deletedModel: {
        id: model.id,
        name: model.model_name,
        status: model.status
      }
    });

  } catch (error) {
    console.error('Delete model endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/models/delete called for batch delete');

  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { modelIds } = await request.json();

    if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
      return NextResponse.json(
        { error: 'Model IDs array is required' },
        { status: 400 }
      );
    }

    // First, verify all models exist and belong to the user
    const { data: models, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .in('id', modelIds);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 500 }
      );
    }

    const userEmail = session.user.email;
    const unauthorizedModels = models?.filter(model => {
      const canDelete = 
        model.user_id === session.user?.id || 
        (model.user_id === 'anonymous' && userEmail === '11jellis@gmail.com');
      return !canDelete;
    }) || [];

    if (unauthorizedModels.length > 0) {
      return NextResponse.json(
        { error: 'You can only delete your own models' },
        { status: 403 }
      );
    }

    // Delete the models
    const { error: deleteError } = await supabase
      .from('trained_models')
      .delete()
      .in('id', modelIds);

    if (deleteError) {
      console.error('Error deleting models:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete models' },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted ${modelIds.length} models`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${modelIds.length} models`,
      deletedCount: modelIds.length,
      deletedModels: models?.map(m => ({ id: m.id, name: m.model_name }))
    });

  } catch (error) {
    console.error('Batch delete models endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 