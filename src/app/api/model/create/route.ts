import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
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

export async function POST(req: NextRequest) {
  console.log('POST /api/model/create called');
  
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
    const { imageDataList, instancePrompt, modelName, trainingSteps } = body;
    
    // Create a unique ID for the training job
    const trainingId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    // Save input data to a temporary file to pass to Modal
    const tempDir = path.join(os.tmpdir(), 'modal-training');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempDataPath = path.join(tempDir, `model_training_data_${trainingId}.json`);
    
    fs.writeFileSync(tempDataPath, JSON.stringify({
      imageDataList,
      instancePrompt, 
      modelName,
      trainingSteps: trainingSteps || 1000,
      callbackUrl: `${process.env.NEXTAUTH_URL || req.headers.get('origin')}/api/modal/training-progress`,
    }));
    
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
            input_data: { promptKeyword: instancePrompt },
          });
        
        if (insertError) {
          console.error('Error inserting training record:', insertError);
          // Continue execution even if database insert fails
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue execution even if database operation fails
      }
    } else {
      console.log('Skipping database operations - Supabase not configured');
    }
    
    // Activate the Modal environment directly using a more reliable approach
    const projectDir = process.cwd();
    const modalEnvBin = path.join(projectDir, 'modal-env', 'bin', 'python');
    
    console.log('Running Modal command with python path:', modalEnvBin);
    
    // Execute the Modal command using spawn to handle spaces in paths properly
    // Use main function entrypoint (local_entrypoint in the Python file)
    const modalProcess = spawn(modalEnvBin, [
      '-m', 
      'modal', 
      'run', 
      'modal_scripts/train_model.py::main', 
      '--input', 
      tempDataPath
    ], {
      cwd: projectDir,
      shell: false
    });
    
    let stdout = '';
    let stderr = '';
    
    modalProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('Modal command output:', output);
    });
    
    modalProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error('Modal command stderr:', error);
    });
    
    modalProcess.on('close', (code) => {
      console.log(`Modal process exited with code ${code}`);
      
      if (code !== 0) {
        console.error('Error running Modal command:', stderr);
        // Update the database with error status (if Supabase is available)
        if (supabase) {
          Promise.resolve(
            supabase
              .from('trained_models')
              .update({
                status: 'failed',
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
        return;
      }
      
      // Try to parse the result from stdout
      try {
        // Use a regex that doesn't require the 's' flag for compatibility
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          // Update the database with the training result (if Supabase is available)
          if (supabase) {
            Promise.resolve(
              supabase
                .from('trained_models')
                .update({
                  status: result.status === 'success' ? 'completed' : 'failed',
                  error_message: result.error,
                  model_info: result.status === 'success' ? result.model_info : null,
                  sample_image: result.status === 'success' ? result.sample_image_base64 : null,
                })
                .eq('id', trainingId)
            )
              .then(() => {
                console.log('Updated training record with result');
              })
              .catch((updateError: Error) => {
                console.error('Error updating training record:', updateError);
              });
          }
        }
      } catch (parseError) {
        console.error('Error parsing Modal output:', parseError);
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
    console.error('Error in POST /api/model/create:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ status: 'error', error: errorMessage }, { status: 500 });
  }
} 