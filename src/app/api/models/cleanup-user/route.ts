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

export async function POST(request: NextRequest) {
  console.log('POST /api/models/cleanup-user called');

  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Only allow cleanup for specific user (you)
    if (userEmail !== '11jellis@gmail.com') {
      return NextResponse.json(
        { error: 'This cleanup is only available for the account owner' },
        { status: 403 }
      );
    }

    // Models to keep (case-insensitive)
    const keepModelNames = ['edd', 'bea', 'jaime', 'cristina'];
    
    // Get all models for this user (including anonymous models)
    const { data: allModels, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .or(`user_id.eq.${session.user.id},user_id.eq.anonymous`)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch models: ${fetchError.message}`);
    }

    console.log('Total models found for user:', allModels?.length || 0);

    // Filter models to delete
    const modelsToDelete = allModels?.filter(model => {
      const modelName = (model.model_name || '').toLowerCase();
      
      // Keep models that contain any of our important names
      const isImportant = keepModelNames.some(name => modelName.includes(name));
      
      // Delete if:
      // 1. Status is 'failed' OR 'pending' (stuck)
      // 2. AND it's not one of our important models
      const isFailedOrPending = ['failed', 'pending'].includes(model.status);
      
      return isFailedOrPending && !isImportant;
    }) || [];

    // Get models to keep for verification
    const modelsToKeep = allModels?.filter(model => {
      const modelName = (model.model_name || '').toLowerCase();
      return keepModelNames.some(name => modelName.includes(name)) || model.status === 'completed';
    }) || [];

    console.log('Models to delete:', modelsToDelete.length);
    console.log('Sample models being deleted:', modelsToDelete.slice(0, 10).map(m => ({ 
      id: m.id, 
      name: m.model_name, 
      status: m.status,
      created_at: m.created_at
    })));

    console.log('Important models being kept:', modelsToKeep.map(m => ({ 
      id: m.id, 
      name: m.model_name, 
      status: m.status 
    })));

    if (modelsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed models need cleanup',
        stats: {
          totalModels: allModels?.length || 0,
          modelsDeleted: 0,
          modelsKept: allModels?.length || 0,
          importantModelsKept: modelsToKeep.length
        }
      });
    }

    // Delete the models in batches
    const batchSize = 50;
    let deletedCount = 0;

    for (let i = 0; i < modelsToDelete.length; i += batchSize) {
      const batch = modelsToDelete.slice(i, i + batchSize);
      const idsToDelete = batch.map(model => model.id);

      const { error: deleteError } = await supabase
        .from('trained_models')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
        throw new Error(`Failed to delete models: ${deleteError.message}`);
      }

      deletedCount += batch.length;
      console.log(`Deleted batch ${i / batchSize + 1}, total deleted: ${deletedCount}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} failed models`,
      stats: {
        totalModels: allModels?.length || 0,
        modelsDeleted: deletedCount,
        modelsKept: (allModels?.length || 0) - deletedCount,
        importantModelsKept: modelsToKeep.length
      },
      importantModelsKept: modelsToKeep.map(m => ({ 
        id: m.id, 
        name: m.model_name, 
        status: m.status,
        created_at: m.created_at
      })),
      deletedModels: modelsToDelete.slice(0, 20).map(m => ({ 
        id: m.id, 
        name: m.model_name, 
        status: m.status 
      }))
    });

  } catch (error) {
    console.error('User cleanup endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 