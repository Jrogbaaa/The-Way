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
  console.log('POST /api/debug/cleanup-models called');

  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Models to keep (case-insensitive search for important models)
    const keepModelNames = ['bea', 'jaime', 'cristina'];
    
    // Get all models to analyze what we're deleting
    const { data: allModels, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch models: ${fetchError.message}`);
    }

    console.log('Total models before cleanup:', allModels?.length || 0);

    // Filter models to delete
    const modelsToDelete = allModels?.filter(model => {
      const modelName = (model.model_name || '').toLowerCase();
      
      // Keep models that contain any of our important names
      const isImportant = keepModelNames.some(name => modelName.includes(name));
      
      // Delete if:
      // 1. Status is 'failed' OR 'pending' (stuck)
      // 2. AND it's not one of our important models
      // 3. OR it's clearly a test model (contains 'test', random chars, etc.)
      const isTestModel = /test|model|^\w{1,10}$|^[a-z0-9]{5,8}$/.test(modelName);
      const isFailedOrPending = ['failed', 'pending'].includes(model.status);
      
      return (isFailedOrPending && !isImportant) || (isTestModel && !isImportant);
    }) || [];

    console.log('Models to delete:', modelsToDelete.length);
    console.log('Sample models being deleted:', modelsToDelete.slice(0, 5).map(m => ({ 
      id: m.id, 
      name: m.model_name, 
      status: m.status 
    })));

    // Get models to keep for verification
    const modelsToKeep = allModels?.filter(model => {
      const modelName = (model.model_name || '').toLowerCase();
      return keepModelNames.some(name => modelName.includes(name));
    }) || [];

    console.log('Important models being kept:', modelsToKeep.map(m => ({ 
      id: m.id, 
      name: m.model_name, 
      status: m.status 
    })));

    if (modelsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No models need cleanup',
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
      message: `Successfully cleaned up ${deletedCount} models`,
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
      }))
    });

  } catch (error) {
    console.error('Cleanup endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 