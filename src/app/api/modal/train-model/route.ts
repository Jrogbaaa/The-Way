import { NextRequest, NextResponse } from 'next/server';

import { execPromise } from "@/lib/server/utils";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';


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
    // Log the raw request for debugging
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    // Get the raw body first to debug
    const rawBody = await request.text();
    console.log('Raw request body length:', rawBody.length);
    console.log('Raw request body (first 500 chars):', rawBody.substring(0, 500));
    
    // Try to parse the JSON
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Successfully parsed JSON body:', Object.keys(body));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw body that failed to parse:', rawBody);
      return NextResponse.json(
        { status: 'error', error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
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
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/modal/training-progress`;

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
        const { stdout: dryRunOutput } = await execPromise(`python3 -m modal run modal_scripts/train_model.py --input ${tempDataPath} --dry-run`);
        console.log('Dry run validation successful:', dryRunOutput);
      } catch (dryRunError) {
        console.error('Dry run validation failed:', dryRunError);
        throw new Error(`Validation failed: ${dryRunError instanceof Error ? dryRunError.message : String(dryRunError)}`);
      }
      
      // Check for existing running jobs to prevent duplicates
      try {
        const { stdout: runningJobs } = await execPromise('python3 -m modal app list');
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
            // lockAcquired remains false, we won't try to release a lock we don't own
          }
        }
      } catch (lockError) {
        console.warn('Error handling training lock:', lockError);
        // Continue anyway since this is just a precaution
      }
      
      // Remove --detach since it doesn't exist in Modal CLI
      // Instead, we'll run the command normally and let it complete
      const modalCommand = `python3 -m modal run modal_scripts/train_model.py --input ${tempDataPath}`;

      // Run the actual training command
      console.log(`Executing Modal command: ${modalCommand}`);
      try {
        // Run the Modal command without --detach
        // This will run synchronously but that's okay for now
        const { stdout, stderr } = await execPromise(modalCommand);
        console.log('Modal command output (stdout):', stdout);
        if (stderr) {
          console.warn('Modal command output (stderr):', stderr);
        }
        
        // Parse the Modal script output to get the training result
        let trainingResult = null;
        try {
          // The Modal script should output JSON result with TRAINING_RESULT_JSON: prefix
          // Look for this specific line in the stdout
          const lines = stdout.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('TRAINING_RESULT_JSON:')) {
              try {
                const jsonStr = trimmedLine.substring('TRAINING_RESULT_JSON:'.length).trim();
                trainingResult = JSON.parse(jsonStr);
                console.log('Parsed training result:', trainingResult);
                break;
              } catch (parseError) {
                console.warn('Could not parse JSON from TRAINING_RESULT_JSON line:', parseError);
                continue;
              }
            }
          }
        } catch (parseError) {
          console.warn('Could not parse training result from Modal output:', parseError);
        }
        
        // Update the database based on the training result
        if (trainingResult) {
          if (trainingResult.status === 'success') {
            // Training completed successfully
            const updateData: any = {
              status: 'completed',
              progress: 100,
            };
            
            // Add model info if available
            if (trainingResult.model_info) {
              updateData.model_info = trainingResult.model_info;
            }
            
            // Add sample image if available
            if (trainingResult.sample_image_base64) {
              updateData.sample_image = trainingResult.sample_image_base64;
            }
            
            const { error: updateError } = await supabase
              .from('trained_models')
              .update(updateData)
              .eq('id', trainingId);
              
            if (updateError) {
              console.error('Error updating training record with success:', updateError);
            } else {
              console.log('Successfully updated training record with completion status');
            }
          } else if (trainingResult.status === 'error') {
            // Training failed
            const { error: updateError } = await supabase
              .from('trained_models')
              .update({
                status: 'failed',
                error_message: trainingResult.error || 'Training failed with unknown error',
              })
              .eq('id', trainingId);
              
            if (updateError) {
              console.error('Error updating training record with failure:', updateError);
            } else {
              console.log('Successfully updated training record with failure status');
            }
          }
        } else {
          // Could not parse result, but command completed - assume success for now
          console.warn('Could not parse training result, but Modal command completed. Assuming success.');
          const { error: updateError } = await supabase
            .from('trained_models')
            .update({
              status: 'completed',
              progress: 100,
              error_message: 'Training completed but result could not be parsed'
            })
            .eq('id', trainingId);
            
          if (updateError) {
            console.error('Error updating training record:', updateError);
          }
        }
        
        // The training should now complete and update the database
        // The Modal script should handle updating the database status
        
        if (lockAcquired) {
          try {
            fs.unlinkSync(lockFile);
            console.log('Released training process lock');
          } catch (unlockError) {
            console.warn('Error releasing lock:', unlockError);
          }
        }

      } catch (error) {
        console.error('Error submitting Modal command:', error);
        // Update the database with error status if submission itself failed
        await supabase
          .from('trained_models')
          .update({
            status: 'error',
            error_message: `Failed to submit training job to Modal: ${error instanceof Error ? error.message : String(error)}`,
          })
          .eq('id', trainingId);
        console.log('Updated training record with submission error status');
        
        if (lockAcquired) {
          try {
            fs.unlinkSync(lockFile);
            console.log('Released training process lock after submission error');
          } catch (unlockError) {
            console.warn('Error releasing lock after submission error:', unlockError);
          }
        }
      }
      
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