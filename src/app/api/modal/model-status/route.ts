import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if credentials are available
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Maximum training time in milliseconds (10 minutes)
const MAX_TRAINING_TIME = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  console.log('GET /api/modal/model-status called');
  
  try {
    // Get the model ID from query params
    const searchParams = req.nextUrl.searchParams;
    const modelId = searchParams.get('id');
    
    if (!modelId) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing model ID parameter'
      }, { status: 400 });
    }
    
    console.log(`Fetching training data for ID: ${modelId}`);
    
    // If Supabase is not configured, return a mock response for development
    if (!supabase) {
      console.log('Supabase not configured, returning mock status');
      return NextResponse.json({
        status: 'in_progress',
        progress: 0.5,
        message: 'Training in progress (mock data - Supabase not configured)'
      });
    }
    
    // Add cache control headers to prevent browser caching
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');
    
    // Query the database for the model status with cache control
    const { data, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();
    
    if (error) {
      console.error('Error fetching model status:', error);
      return NextResponse.json({
        status: 'error',
        error: error.message
      }, { status: 500, headers });
    }
    
    if (!data) {
      return NextResponse.json({
        status: 'error',
        error: 'Model not found'
      }, { status: 404, headers });
    }
    
    // Calculate progress based on status
    let progress = 0;
    let actualStatus = data.status;
    
    // Auto-complete extremely long-running jobs (failsafe)
    const createdAt = new Date(data.created_at).getTime();
    const now = Date.now();
    const trainingTime = now - createdAt;
    
    if (trainingTime > MAX_TRAINING_TIME && 
        actualStatus !== 'completed' && 
        actualStatus !== 'failed') {
      
      console.log(`Training job ${modelId} has exceeded max training time, marking as failed`);
      
      // Update status in the database
      await supabase
        .from('trained_models')
        .update({
          status: 'failed',
          error_message: 'Training exceeded maximum allowed time'
        })
        .eq('id', modelId);
      
      actualStatus = 'failed';
    }
    
    // Check for success indicators in model_info
    if (data.model_info && 
        typeof data.model_info === 'object' && 
        actualStatus !== 'completed' && 
        actualStatus !== 'failed') {
      
      // If we have model_info but status isn't completed, it likely means
      // the final status update failed - fix it now
      if (Object.keys(data.model_info).length > 0) {
        console.log(`Model ${modelId} has model_info but status is ${actualStatus}, correcting to completed`);
        
        await supabase
          .from('trained_models')
          .update({ status: 'completed' })
          .eq('id', modelId);
        
        actualStatus = 'completed';
      }
    }
    
    switch (actualStatus) {
      case 'starting':
        progress = 0.1;
        break;
      case 'preprocessing':
        progress = 0.3;
        break;
      case 'training':
        // If there's a progress field, use it, otherwise default to 0.5
        progress = data.progress || 0.5;
        break;
      case 'completed':
        progress = 1.0;
        break;
      case 'failed':
        progress = 0;
        break;
      default:
        progress = 0.2;
    }
    
    // Return the model status with cache control headers
    return NextResponse.json({
      status: actualStatus,
      progress,
      model_name: data.model_name,
      error_message: data.error_message,
      model_info: data.model_info,
      created_at: data.created_at,
      updated_at: data.updated_at
    }, { headers });
    
  } catch (error) {
    console.error('Error in GET /api/modal/model-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      status: 'error',
      error: errorMessage
    }, { status: 500 });
  }
} 