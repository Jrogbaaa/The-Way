import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if credentials are available
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(req: NextRequest) {
  console.log('GET /api/modal/user-models called');
  
  try {
    // Get user session with improved authentication
    let userId = 'anonymous';
    let userEmail = null;
    let sessionData = null;
    
    try {
      const session = await auth();
      console.log('Auth session:', { 
        hasSession: !!session, 
        hasUser: !!session?.user, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      
      if (session && session.user && session.user.id) {
        userId = session.user.id;
        userEmail = session.user.email;
        sessionData = session;
      }
    } catch (authError) {
      console.error('Auth error:', authError);
      // Continue execution even if auth fails
    }
    
    // If Supabase is not configured, return a mock response for development
    if (!supabase) {
      console.log('Supabase not configured, returning mock models data');
      return NextResponse.json({
        status: 'success',
        debug: {
          supabaseConfigured: false,
          userId,
          userEmail
        },
        models: []
      });
    }
    
    // Query for all user models
    let query = supabase
      .from('trained_models')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Enhanced user filtering to handle different authentication scenarios
    if (userId !== 'anonymous') {
      // Handle known Google OAuth users with their specific UUIDs
      if (userEmail === '11jellis@gmail.com' || userId === '11fbbde8-3e75-4a7a-8ee7-70947796f0ec') {
        console.log('🔍 Detected Google OAuth user 11jellis@gmail.com, using specific UUID filter');
        query = query.eq('user_id', '11fbbde8-3e75-4a7a-8ee7-70947796f0ec');
      } else if (userEmail === 'johnbanks8888@gmail.com') {
        console.log('🔍 Detected Google OAuth user johnbanks8888@gmail.com, checking all possible user IDs');
        // We need to find what user_id this user's models are stored under
        // Let's check both the session ID and also do a broader search
        console.log('Session user ID for johnbanks8888@gmail.com:', userId);
        query = query.eq('user_id', userId);
      } else {
        // Standard user ID filtering
        console.log('🔍 Using standard user ID filter:', userId);
        query = query.eq('user_id', userId);
      }
    } else {
      console.log('🔍 Anonymous user, checking session-based models');
      // For anonymous users, don't apply user_id filter to see all models (for debugging)
    }
    
    console.log('🔍 Query conditions:', {
      userId,
      userEmail,
      isGoogleUser: userEmail === '11jellis@gmail.com',
      queryFilter: userId !== 'anonymous' ? 
        (userEmail === '11jellis@gmail.com' ? '11fbbde8-3e75-4a7a-8ee7-70947796f0ec' : userId) : 
        'none (anonymous)'
    });
    
    const { data, error } = await query;
    
    // Additional debug query for johnbanks8888@gmail.com to see all possible models
    let debugData = null;
    if (userEmail === 'johnbanks8888@gmail.com') {
      console.log('🔬 Running debug query for johnbanks8888@gmail.com to find all possible models...');
      const { data: allModels } = await supabase
        .from('trained_models')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Look for models that might belong to this user by various criteria
      const possibleModels = (allModels || []).filter((model: any) => {
        return model.user_id?.includes('johnbanks') ||
               model.user_id === userId ||
               model.model_name?.toLowerCase().includes('test') ||
               model.created_at > '2024-12-20'; // Recent models
      });
      
      console.log('🔬 Debug - All possible models for johnbanks8888@gmail.com:', possibleModels.map((m: any) => ({
        id: m.id,
        name: m.model_name,
        user_id: m.user_id,
        status: m.status,
        created_at: m.created_at
      })));
      
      debugData = possibleModels;
    }
    
    console.log('User models query results:', {
      userId,
      userEmail,
      resultCount: data?.length || 0,
      queryError: error?.message,
      sampleResults: data?.slice(0, 3),
      debugResultsCount: debugData?.length || 0
    });
    
    if (error) {
      console.error('Error fetching user models:', error);
      return NextResponse.json({
        status: 'error',
        error: error.message,
        debug: {
          userId,
          userEmail,
          query: 'all user models'
        }
      }, { status: 500 });
    }
    
    // Filter out obvious test models but keep all legitimate models
    const filteredModels = (data || []).filter((model: any) => {
      const modelName = (model.model_name || '').toLowerCase().trim();
      
      // Only exclude models that are clearly temporary tests with very specific patterns
      // Be much more permissive to avoid hiding legitimate user models
      // Only exclude obvious auto-generated test models, not user-created models
      const isObviousTestModel = /^(temp|temporary|placeholder|debug)[\d_-]*$/i.test(modelName) ||
                                 modelName === '' ||
                                 modelName === 'untitled' ||
                                 /^model[\d_-]*test[\d_-]*$/i.test(modelName);
      
      // Keep all other models, including user models named "test"
      return !isObviousTestModel;
    });
    
    console.log('Filtered models:', filteredModels.map((m: any) => ({ 
      id: m.id, 
      name: m.model_name, 
      status: m.status 
    })));
    
    // Return the models with debug information
    return NextResponse.json({
      status: 'success',
      models: filteredModels,
      debug: {
        userId,
        userEmail,
        isAuthenticated: userId !== 'anonymous',
        totalModelsFound: filteredModels.length,
        allUserModels: true,
        // Include debug data for johnbanks8888@gmail.com
        ...(userEmail === 'johnbanks8888@gmail.com' && debugData && {
          possibleModels: debugData.map((m: any) => ({
            id: m.id,
            name: m.model_name,
            user_id: m.user_id,
            status: m.status
          }))
        })
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/modal/user-models:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      status: 'error',
      error: errorMessage,
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 });
  }
} 