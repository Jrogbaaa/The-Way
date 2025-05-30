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

export async function GET(request: NextRequest) {
  console.log('DEBUG: Checking models database state');

  try {
    // Get current user
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get all models without any filtering
    const { data: allModels, error: allError } = await supabase
      .from('trained_models')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('All models in database:', allModels);

    // Search for specific models by name
    const { data: beaModels, error: beaError } = await supabase
      .from('trained_models')
      .select('*')
      .ilike('model_name', '%bea%');

    const { data: cristinaModels, error: cristinaError } = await supabase
      .from('trained_models')
      .select('*')
      .ilike('model_name', '%cristina%');

    const { data: jaimeModels, error: jaimeError } = await supabase
      .from('trained_models')
      .select('*')
      .ilike('model_name', '%jaime%');

    // Check for models with similar names
    const { data: similarModels, error: similarError } = await supabase
      .from('trained_models')
      .select('*')
      .or('model_name.ilike.%bea%,model_name.ilike.%cristina%,model_name.ilike.%jaime%,model_name.ilike.%portrait%,model_name.ilike.%person%');

    // Group models by user_id to see distribution
    const userGroups: { [key: string]: any[] } = {};
    allModels?.forEach(model => {
      const userId = model.user_id || 'no_user_id';
      if (!userGroups[userId]) {
        userGroups[userId] = [];
      }
      userGroups[userId].push({
        id: model.id,
        name: model.model_name,
        status: model.status,
        created_at: model.created_at
      });
    });

    // Check table schema
    const { data: tableInfo } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'trained_models')
      .eq('table_schema', 'public');

    // Note: RLS policies check removed due to API limitations

    const debugInfo = {
      timestamp: new Date().toISOString(),
      authentication: {
        hasSession: !!session,
        currentUserId,
        userEmail: session?.user?.email
      },
      database: {
        totalModels: allModels?.length || 0,
        modelsByUser: Object.keys(userGroups).map(userId => ({
          userId,
          count: userGroups[userId].length,
          models: userGroups[userId]
        })),
        tableSchema: tableInfo,
      },
      specificSearches: {
        bea: {
          count: beaModels?.length || 0,
          models: beaModels || [],
          error: beaError?.message
        },
        cristina: {
          count: cristinaModels?.length || 0,
          models: cristinaModels || [],
          error: cristinaError?.message
        },
        jaime: {
          count: jaimeModels?.length || 0,
          models: jaimeModels || [],
          error: jaimeError?.message
        },
        similar: {
          count: similarModels?.length || 0,
          models: similarModels || [],
          error: similarError?.message
        }
      },
      environment: {
        supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        nodeEnv: process.env.NODE_ENV
      }
    };

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 