import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface for training completion payload
interface TrainingCompletion {
  trainingId: string;
  status: 'success' | 'error';
  error?: string;
  modelInfo?: {
    modelId: string;
    baseModel: string;
    modelName: string;
    instancePrompt: string;
    trainingSteps: number;
    imageCount: number;
  };
  outputUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as TrainingCompletion;
    
    // Validate required fields
    if (!data.trainingId) {
      return NextResponse.json(
        { error: 'Training ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Received training completion for ID ${data.trainingId}:`, data);
    
    // Prepare data for database update
    const updateData: any = {
      status: data.status === 'success' ? 'completed' : 'error',
      progress: data.status === 'success' ? 100 : 0,
      error_message: data.error || null,
      last_update: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
    
    // Add model info if success
    if (data.status === 'success' && data.modelInfo) {
      updateData.model_info = data.modelInfo;
      updateData.model_url = data.outputUrl;
    }
    
    // Update the database
    const { data: updatedData, error } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', data.trainingId)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating training completion for ID ${data.trainingId}:`, error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Updated training completion for ID ${data.trainingId}`);
    
    return NextResponse.json(
      { 
        success: true,
        data: updatedData
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in training completion API:', error);
    return NextResponse.json(
      { 
        error: `Server error: ${error instanceof Error ? error.message : String(error)}`
      },
      { status: 500 }
    );
  }
} 