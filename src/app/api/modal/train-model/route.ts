import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const execPromise = util.promisify(exec);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to validate base64 image
const validateBase64Image = (base64Data: string): boolean => {
  try {
    // Check if the base64 string has a reasonable length
    if (!base64Data || base64Data.length < 100) {
      return false;
    }

    // Basic structural check - decode a small sample to see if it's valid base64
    Buffer.from(base64Data.slice(0, 100), 'base64');
    
    return true;
  } catch (error) {
    console.error('Invalid base64 image data:', error);
    return false;
  }
};

export async function POST(request: NextRequest) {
  console.log('POST /api/modal/train-model called');
  
  try {
    // Parse the JSON body
    const body = await request.json();
    const { imageDataList, instancePrompt, modelName, trainingSteps } = body;
    
    // Strict validation - return errors immediately
    if (!modelName || modelName.length < 3) {
      return NextResponse.json(
        { status: 'error', error: 'Valid model name is required (at least 3 characters)' },
        { status: 400 }
      );
    }
    
    if (!instancePrompt) {
      return NextResponse.json(
        { status: 'error', error: 'Instance prompt is required' },
        { status: 400 }
      );
    }
    
    if (!instancePrompt.includes('sks')) {
      return NextResponse.json(
        { status: 'error', error: 'Instance prompt must include "sks" as the identifier' },
        { status: 400 }
      );
    }

    // Validate training steps
    const steps = parseInt(trainingSteps) || 300; // Default to 300 (balanced preset)
    if (isNaN(steps) || steps < 100 || steps > 2000) {
      return NextResponse.json(
        { 
          status: 'error', 
          error: 'Training steps must be between 100 and 2000. Recommended presets: Fast (150), Balanced (300), High Quality (800)' 
        },
        { status: 400 }
      );
    }
    
    // Validate image data
    const validImages = [];
    const invalidImages = [];
    
    if (!Array.isArray(imageDataList) || imageDataList.length === 0) {
      return NextResponse.json(
        { status: 'error', error: 'No images provided' },
        { status: 400 }
      );
    }
    
    if (imageDataList.length < 5) {
      return NextResponse.json(
        { status: 'error', error: 'At least 5 images are required for model training' },
        { status: 400 }
      );
    }
    
    // Validate each image
    for (let i = 0; i < imageDataList.length; i++) {
      const img = imageDataList[i];
      if (!img || !img.base64Data || !validateBase64Image(img.base64Data)) {
        invalidImages.push(i);
        console.error(`Invalid image at index ${i}`);
      } else {
        validImages.push(img);
      }
    }
    
    if (validImages.length < 5) {
      return NextResponse.json(
        { status: 'error', error: `At least 5 valid images are required. Found ${validImages.length} valid images out of ${imageDataList.length}.` },
        { status: 400 }
      );
    }
    
    if (invalidImages.length > 0) {
      console.warn(`Skipping ${invalidImages.length} invalid images`);
    }
    
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
    
    // Prepare callback URL to report progress
    let callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/modal/training-progress`;

    // For local development, ensure we don't pass localhost URL to Modal
    // as it won't be able to reach back to the local machine
    if (callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1')) {
      console.log(`Warning: Using localhost callback URL in development: ${callbackUrl}`);
      console.log('The training will continue but progress updates may fail');
      // We'll keep the URL, but the Modal script will handle it properly now
    }
    
    // Create result file path for the Modal script to write to
    const tempDir = path.join(os.tmpdir(), 'modal-training');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempDataPath = path.join(tempDir, `model_training_data_${trainingId}.json`);
    const resultFilePath = path.join(tempDir, `model_training_result_${trainingId}.json`);
    
    fs.writeFileSync(tempDataPath, JSON.stringify({
      imageDataList: validImages, // Only send validated images
      instancePrompt, 
      modelName,
      trainingSteps: trainingSteps || 1000,
      callbackUrl,
      resultFilePath, // Let Modal know where to save the result
      modelId: trainingId,  // Include the model ID for progress tracking
      outputPath: resultFilePath // Additional field for the result file path
    }));
    
    // Insert a record into the database to track the training job
    const { error: insertError } = await supabase
      .from('trained_models')
      .insert({
        id: trainingId,
        user_id: userId,
        model_name: modelName,
        status: 'pending', // Start with pending status until Modal confirms it's running
        progress: 0,
        created_at: new Date().toISOString(),
        input_data: { 
          instancePrompt: instancePrompt, // Store prompt in the JSONB field
          trainingSteps: trainingSteps || 1000, // Store training steps in the JSONB field instead
          imageCount: validImages.length,
          skippedImages: invalidImages.length
        },
      });
    
    if (insertError) {
      console.error('Error inserting training record:', insertError);
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    // Start the Modal training job as a child process
    try {
      // Use the full training script instead of simplified
      const modalCommand = `python3 -m modal run modal_scripts/train_model.py --input ${tempDataPath}`;
      
      // Check if modal package is installed
      try {
        await execPromise('python3 -c "import modal"');
      } catch (moduleError) {
        console.error('Modal module not found:', moduleError);
        throw new Error('Modal Python package is not installed. Please run "pip install modal" to install it.');
      }
      
      // Check if the script exists
      const scriptPath = path.join(process.cwd(), 'modal_scripts/train_model.py');
      if (!fs.existsSync(scriptPath)) {
        console.error('Script not found:', scriptPath);
        throw new Error('Training script not found. Please make sure modal_scripts/train_model.py exists.');
      }
      
      // Validate the training parameters with a dry run first
      console.log('Validating training parameters with dry run...');
      try {
        // The --dry-run flag doesn't need a value, it's a simple flag
        const { stdout: dryRunOutput } = await execPromise(`python3 -m modal run modal_scripts/train_model.py --input ${tempDataPath} --dry-run`);
        console.log('Dry run validation successful:', dryRunOutput);
      } catch (dryRunError) {
        console.error('Dry run validation failed:', dryRunError);
        throw new Error(`Validation failed: ${dryRunError instanceof Error ? dryRunError.message : String(dryRunError)}`);
      }
      
      // Try running the command with --help to see if the script is available
      try {
        const { stdout: helpOutput } = await execPromise('python3 -m modal run modal_scripts/train_model.py --help');
        console.log('Modal script help:', helpOutput);
      } catch (error) {
        console.error('Error checking modal script help:', error);
        throw new Error(`Modal script check failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Check for existing running jobs to prevent duplicates
      try {
        const { stdout: runningJobs } = await execPromise('python3 -m modal app ps');
        console.log('Current running Modal apps:', runningJobs);
        
        // If there are already running instances of the same app, log this but continue
        // We'll let Modal handle ensuring there's only one instance per input
        if (runningJobs.includes('custom-image-model-trainer')) {
          console.log('Warning: Found existing running training jobs. This is a new job with ID:', trainingId);
        }
      } catch (listError) {
        console.warn('Unable to check running Modal apps:', listError);
        // Continue anyway since this is just a precaution
      }
      
      // If no immediate errors, update status to starting and run the actual training
      await supabase
        .from('trained_models')
        .update({ 
          status: 'training',
          progress: 0,
          last_update: new Date().toISOString(),
        })
        .eq('id', trainingId);
      
      // Use a mutex/lock mechanism to ensure only one training process is launched at a time
      // This is a simple solution - for production, use a proper locking mechanism
      const lockFile = path.join(os.tmpdir(), 'modal-training-lock');
      let lockAcquired = false;
      
      try {
        // Try to create a lock file
        if (!fs.existsSync(lockFile)) {
          fs.writeFileSync(lockFile, trainingId);
          lockAcquired = true;
          console.log('Acquired lock for training process');
        } else {
          // Lock file exists, read it to see if it's stale
          const lockData = fs.readFileSync(lockFile, 'utf8');
          const lockTimestamp = parseInt(lockData.split('-')[0], 36);
          const currentTime = Date.now();
          
          // If lock is older than 5 minutes, consider it stale
          if (currentTime - lockTimestamp > 5 * 60 * 1000) {
            fs.writeFileSync(lockFile, trainingId);
            lockAcquired = true;
            console.log('Acquired stale lock for training process');
          } else {
            console.log('Another training process is active. Will run anyway but with caution.');
          }
        }
      } catch (lockError) {
        console.warn('Error handling training lock:', lockError);
        // Continue anyway since this is just a precaution
      }
      
      // Run the actual training asynchronously with more robust error handling
      console.log(`Executing Modal command: ${modalCommand}`);
      const childProcess = exec(modalCommand, (error, stdout, stderr) => {
        // This runs asynchronously after the response is sent
        console.log('Modal command output:', stdout);
        
        // Release the lock if we acquired it
        if (lockAcquired) {
          try {
            fs.unlinkSync(lockFile);
            console.log('Released training process lock');
          } catch (unlockError) {
            console.warn('Error releasing lock:', unlockError);
          }
        }
        
        if (error) {
          console.error('Error running Modal command:', error);
          // Update the database with error status
          (async () => {
            try {
              await supabase
                .from('trained_models')
                .update({
                  status: 'error',
                  error_message: `Command error: ${error.message}\n\nStdout: ${stdout}\n\nStderr: ${stderr}`,
                  last_update: new Date().toISOString(),
                })
                .eq('id', trainingId);
              console.log('Updated training record with error status');
            } catch (updateError) {
              console.error('Error updating training record:', updateError);
            }
          })();
          return;
        }
        
        // Check if the result file exists
        if (fs.existsSync(resultFilePath)) {
          try {
            const resultData = JSON.parse(fs.readFileSync(resultFilePath, 'utf8'));
            
            // Update the database with the training result
            (async () => {
              try {
                await supabase
                  .from('trained_models')
                  .update({
                    status: resultData.status === 'success' ? 'completed' : 'error',
                    error_message: resultData.error,
                    model_info: resultData.status === 'success' ? resultData.model_info : null,
                    sample_image: resultData.status === 'success' ? resultData.sample_image_base64 : null,
                    last_update: new Date().toISOString(),
                  })
                  .eq('id', trainingId);
                console.log('Updated training record with result from file');
              } catch (updateError) {
                console.error('Error updating training record:', updateError);
              }
            })();
          } catch (parseError) {
            console.error('Error parsing result file:', parseError);
          }
        } else {
          // Try to parse the result from stdout as a fallback
          try {
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              
              // Update the database with the training result
              (async () => {
                try {
                  await supabase
                    .from('trained_models')
                    .update({
                      status: result.status === 'success' ? 'completed' : 'error',
                      error_message: result.error,
                      model_info: result.status === 'success' ? result.model_info : null,
                      sample_image: result.status === 'success' ? result.sample_image_base64 : null,
                      last_update: new Date().toISOString(),
                    })
                    .eq('id', trainingId);
                  console.log('Updated training record with result from stdout');
                } catch (updateError) {
                  console.error('Error updating training record:', updateError);
                }
              })();
            }
          } catch (parseError) {
            console.error('Error parsing Modal output:', parseError);
          }
        }
        
        // Clean up the temporary files
        try {
          if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
          if (fs.existsSync(resultFilePath)) fs.unlinkSync(resultFilePath);
        } catch (unlinkError) {
          console.error('Error removing temporary files:', unlinkError);
        }
      });
      
      // Return immediate response with the training job ID
      return NextResponse.json({
        status: 'success',
        message: 'Model training started',
        trainingId,
      }, { status: 202 });
    } catch (modalError) {
      console.error('Error starting Modal training process:', modalError);
      return NextResponse.json({
        status: 'error', 
        error: `Failed to start training process: ${modalError instanceof Error ? modalError.message : String(modalError)}`
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in POST /api/modal/train-model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ status: 'error', error: errorMessage }, { status: 500 });
  }
}