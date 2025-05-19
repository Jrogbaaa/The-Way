import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if credentials are available
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Track training analytics
const trackTrainingStart = async (userId: string, modelId: string, imageCount: number) => {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('training_analytics')
      .insert({
        user_id: userId,
        model_id: modelId,
        image_count: imageCount,
        training_time: 0,
        started_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error tracking training start:', error);
    }
  } catch (error) {
    console.error('Failed to record training analytics:', error);
    // Non-critical error, continue execution
  }
};

const updateTrainingCompletion = async (modelId: string, success: boolean, errorMessage?: string) => {
  if (!supabase) return;
  
  try {
    // Calculate training duration
    const { data: trainingRecord, error: fetchError } = await supabase
      .from('training_analytics')
      .select('started_at')
      .eq('model_id', modelId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching training record:', fetchError);
      return;
    }
    
    // Calculate duration in seconds
    const startedAt = new Date(trainingRecord.started_at);
    const completedAt = new Date();
    const trainingTime = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
    
    // Update the record
    const { error } = await supabase
      .from('training_analytics')
      .update({
        completed: success,
        error_message: errorMessage || null,
        training_time: trainingTime,
        completed_at: completedAt.toISOString()
      })
      .eq('model_id', modelId);
      
    if (error) {
      console.error('Error updating training completion:', error);
    }
  } catch (error) {
    console.error('Failed to update training analytics:', error);
  }
};

export async function POST(req: NextRequest) {
  console.log('POST /api/model/train called');
  
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
    
    // Parse the JSON body
    const body = await req.json();
    const { imageDataList, instancePrompt, modelName } = body;
    
    // Create a unique ID for the training job
    const trainingId = `lora-${uuidv4().substring(0, 8)}`; 
    
    // Track training start with analytics
    await trackTrainingStart(userId, trainingId, imageDataList.length);
    
    // Save input data to a temporary file to pass to Modal
    const tempDir = path.join(os.tmpdir(), 'kohya-training');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempDataPath = path.join(tempDir, `training_data_${trainingId}.json`);
    
    // Build proper absolute callback URL
    let origin = process.env.NEXTAUTH_URL || req.headers.get('origin') || '';
    
    // Ensure origin doesn't have trailing slash
    if (origin.endsWith('/')) {
      origin = origin.slice(0, -1);
    }
    
    // Make sure we have a valid origin URL
    if (!origin) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http://' : 'https://';
      origin = `${protocol}${host}`;
    }
    
    const callbackUrl = `${origin}/api/modal/training-progress`;
    
    // Log the callback URL
    console.log(`Using callback URL: ${callbackUrl}`);
    if (origin.includes('localhost')) {
      console.log('Warning: Using localhost callback URL in development: ' + callbackUrl);
      console.log('The training will continue but progress updates may fail');
    }
    
    // Ensure we're passing the Supabase credentials explicitly
    const trainingConfig = {
      imageDataList,
      instancePrompt, 
      modelName,
      modelId: trainingId,
      callbackUrl,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    
    console.log(`Preparing training with model ID: ${trainingId}`);
    console.log(`Supabase URL provided: ${trainingConfig.supabaseUrl ? 'Yes' : 'No'}`);
    console.log(`Supabase key provided: ${trainingConfig.supabaseKey ? 'Yes (length: ' + trainingConfig.supabaseKey.length + ')' : 'No'}`);
    
    fs.writeFileSync(tempDataPath, JSON.stringify(trainingConfig));
    
    // Insert a record into the database to track the training job (if Supabase is available)
    if (supabase) {
      try {
        const { error: insertError } = await supabase
          .from('trained_models')
          .insert({
            id: trainingId,
            user_id: userId,
            model_name: modelName,
            status: 'starting',
            progress: 0,
            model_type: 'lora',
            input_data: { promptKeyword: instancePrompt },
          });
        
        if (insertError) {
          console.error('Error inserting training record:', insertError);
          // Continue execution even if database insert fails
        } else {
          console.log(`Successfully created training record with ID: ${trainingId}`);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue execution even if database operation fails
      }
    } else {
      console.log('Skipping database operations - Supabase not configured');
    }
    
    // Activate the Modal environment and run the training script
    const projectDir = process.cwd();
    const modalEnvBin = path.join(projectDir, 'modal-env', 'bin', 'python');
    
    console.log('Running Modal training command with python path:', modalEnvBin);
    
    // Execute the Modal command using spawn for better process handling
    const modalProcess = spawn(modalEnvBin, [
      '-m', 
      'modal', 
      'run', 
      'modal_scripts/train_kohya.py::main', 
      '--input', 
      tempDataPath
    ], {
      cwd: projectDir,
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      },
      shell: false
    });
    
    let stdout = '';
    let stderr = '';
    
    modalProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('Modal training output:', output);
    });
    
    modalProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error('Modal training stderr:', error);
    });
    
    modalProcess.on('close', (code) => {
      console.log(`Modal training process exited with code ${code}`);
      
      if (code !== 0) {
        console.error('Error running Modal training command:', stderr);
        // Update analytics with training failure
        updateTrainingCompletion(trainingId, false, stderr || 'Process exited with non-zero code');
        
        // Update the database with error status (if Supabase is available)
        if (supabase) {
          Promise.resolve(
            supabase
              .from('trained_models')
              .update({
                status: 'failed',
                progress: 0,
                error_message: stderr || 'Process exited with non-zero code',
              })
              .eq('id', trainingId)
          )
            .then(() => {
              console.log('Updated training record with error status');
            })
            .catch((updateError: Error) => {
              console.error('Error updating training record:', updateError);
            });
        }
      }
      
      // Try to parse the result from stdout
      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          // Update analytics with training completion
          const success = result.status === 'success';
          updateTrainingCompletion(trainingId, success, result.error);
          
          // Update the database with the training result (if Supabase is available)
          if (supabase) {
            Promise.resolve(
              supabase
                .from('trained_models')
                .update({
                  status: result.status === 'success' ? 'completed' : 'failed',
                  progress: result.status === 'success' ? 1.0 : 0,
                  error_message: result.error,
                  model_info: result.status === 'success' ? result.model_info : null,
                  sample_image: result.status === 'success' ? result.sample_image_base64 : null,
                })
                .eq('id', trainingId)
            )
              .then(() => {
                console.log('Updated training record with final result');
              })
              .catch((updateError: Error) => {
                console.error('Error updating training record:', updateError);
              });
          }
        }
      } catch (parseError) {
        console.error('Error parsing Modal training output:', parseError);
        // Update analytics with parsing failure
        updateTrainingCompletion(trainingId, false, 'Error parsing training output');
      }
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempDataPath);
      } catch (unlinkError) {
        console.error('Error removing temporary file:', unlinkError);
      }
    });
    
    // Return immediate response with the training job ID
    return NextResponse.json({
      status: 'success',
      message: 'Model training started',
      trainingId,
    }, { status: 202 });
    
  } catch (error) {
    console.error('Error in POST /api/model/train:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ status: 'error', error: errorMessage }, { status: 500 });
  }
} 