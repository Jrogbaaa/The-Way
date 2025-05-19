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
    // Get user session (optional)
    let userId = 'anonymous';
    try {
      const session = await auth();
      if (session && session.user && session.user.id) {
        userId = session.user.id;
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
        models: [
          {
            id: 'mock-model-1',
            model_name: 'Mock Portrait Model',
            status: 'completed',
            created_at: new Date().toISOString(),
            user_id: userId,
            model_info: {
              instance_prompt: 'a photo of sks person',
              image_count: 10
            }
          },
          {
            id: 'mock-model-2',
            model_name: 'Mock Product Model',
            status: 'training',
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_id: userId,
            model_info: {
              instance_prompt: 'a photo of sks product',
              image_count: 8
            }
          }
        ]
      });
    }
    
    // Query the database for user's models
    const { data, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user models:', error);
      return NextResponse.json({
        status: 'error',
        error: error.message
      }, { status: 500 });
    }
    
    // Return the models
    return NextResponse.json({
      status: 'success',
      models: data
    });
    
  } catch (error) {
    console.error('Error in GET /api/modal/user-models:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      status: 'error',
      error: errorMessage
    }, { status: 500 });
  }
} 