import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const execPromise = util.promisify(exec);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('POST /api/modal/train-model called');
  
  try {
    // Parse the JSON body
    const body = await request.json();
    const { imageDataList, instancePrompt, modelName, trainingSteps, callbackUrl } = body;
    
    // Get user information from auth (assuming authentication is already set up)
    const authHeader = request.headers.get('authorization');
    let userId = 'anonymous'; // Default value
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Verify token and get user info
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        console.error('Error verifying user token:', error);
      }
    }
    
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
      callbackUrl,
    }));
    
    // Insert a record into the database to track the training job
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
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    // Start the Modal training job in the background
    const modalCommand = `python3 -m modal run modal_scripts/train_model.py --input ${tempDataPath}`;
    exec(modalCommand, (error, stdout, stderr) => {
      // This runs asynchronously after the response is sent
      console.log('Modal command output:', stdout);
      
      if (error) {
        console.error('Error running Modal command:', error);
        // Update the database with error status
        (async () => {
          try {
            await supabase
              .from('trained_models')
              .update({
                status: 'failed',
                error_message: error.message,
              })
              .eq('id', trainingId);
            console.log('Updated training record with error status');
          } catch (updateError) {
            console.error('Error updating training record:', updateError);
          }
        })();
        return;
      }
      
      // Try to parse the result from stdout
      try {
        // Use a regex that doesn't require the 's' flag for compatibility
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          // Update the database with the training result
          (async () => {
            try {
              await supabase
                .from('trained_models')
                .update({
                  status: result.status === 'success' ? 'completed' : 'failed',
                  error_message: result.error,
                  model_info: result.status === 'success' ? result.model_info : null,
                  sample_image: result.status === 'success' ? result.sample_image_base64 : null,
                })
                .eq('id', trainingId);
              console.log('Updated training record with result');
            } catch (updateError) {
              console.error('Error updating training record:', updateError);
            }
          })();
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
    console.error('Error in POST /api/modal/train-model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ status: 'error', error: errorMessage }, { status: 500 });
  }
} 