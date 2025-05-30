import { NextRequest, NextResponse } from 'next/server';

import { execPromise } from "@/lib/server/utils";
import fs from 'fs';
import path from 'path';
import os from 'os';


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
  console.log('POST /api/modal/validate-model called');
  
  try {
    // Parse the JSON body
    const body = await request.json();
    const { imageDataList, instancePrompt, modelName, trainingSteps } = body;
    
    // Initialize validation data
    const validationData = {
      valid: true,
      warnings: [] as string[],
      imageData: {
        totalImages: imageDataList?.length || 0,
        validImages: 0,
        invalidImages: 0,
      },
      estimatedTrainingTime: {
        steps: trainingSteps || 1000,
        minutes: 0,
      },
      modelValidation: {
        success: false,
        message: '',
      },
    };
    
    // Validate model name
    if (!modelName || modelName.length < 3) {
      return NextResponse.json({
        status: 'error',
        error: 'Valid model name is required (at least 3 characters)',
      }, { status: 400 });
    }
    
    // Validate instance prompt
    if (!instancePrompt) {
      return NextResponse.json({
        status: 'error',
        error: 'Instance prompt is required',
      }, { status: 400 });
    }
    
    if (!instancePrompt.includes('sks')) {
      return NextResponse.json({
        status: 'error',
        error: 'Instance prompt must include "sks" as the identifier',
      }, { status: 400 });
    }
    
    // Validate images
    if (!Array.isArray(imageDataList) || imageDataList.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'No images provided',
      }, { status: 400 });
    }
    
    // Check minimum number of images
    if (imageDataList.length < 5) {
      return NextResponse.json({
        status: 'error',
        error: 'At least 5 images are required for model training',
      }, { status: 400 });
    }
    
    // Validate each image
    const validImages = [];
    const invalidIndices = [];
    
    for (let i = 0; i < imageDataList.length; i++) {
      const img = imageDataList[i];
      if (!img || !img.base64Data || !validateBase64Image(img.base64Data)) {
        invalidIndices.push(i);
      } else {
        validImages.push(img);
      }
    }
    
    validationData.imageData.validImages = validImages.length;
    validationData.imageData.invalidImages = invalidIndices.length;
    
    if (validImages.length < 5) {
      return NextResponse.json({
        status: 'error',
        error: `At least 5 valid images are required. Found ${validImages.length} valid images.`,
      }, { status: 400 });
    }
    
    // Add warnings for low image count
    if (validImages.length < 10) {
      validationData.warnings.push('For best results, we recommend using at least 10 images');
    }
    
    // Validate training steps
    if (trainingSteps < 500) {
      validationData.warnings.push('Training with fewer than 500 steps may produce poor results');
    }
    
    if (trainingSteps > 2000) {
      validationData.warnings.push('Training with more than 2000 steps may not improve results significantly');
    }
    
    // Estimate training time based on number of images and steps
    // This is a rough estimate: ~1.5 minutes per 100 steps with 10 images (T4 GPU)
    const baseTimePerStep = 0.015; // minutes per step
    const imageMultiplier = Math.max(1, validImages.length / 10);
    validationData.estimatedTrainingTime.minutes = Math.round(trainingSteps * baseTimePerStep * imageMultiplier);
    
    // Check Modal installation
    try {
      // Check if modal package is installed
      await execPromise('python3 -c "import modal"');
    } catch (moduleError) {
      console.error('Modal module not found:', moduleError);
      validationData.warnings.push('Modal Python package is not installed. Training may fail.');
    }
    
    // Check if script exists
    const scriptPath = path.join(process.cwd(), 'modal_scripts/train_model.py');
    if (!fs.existsSync(scriptPath)) {
      console.error('Script not found:', scriptPath);
      validationData.warnings.push('Training script not found. Please make sure modal_scripts/train_model.py exists.');
    }
    
    // Validate training parameters by running a dry run of the Modal training script
    try {
      if (validImages.length >= 5) {
        // Save input data for the validation
        const tempDataPath = path.join(os.tmpdir(), `modal-validate-data-${Date.now()}.json`);
        fs.writeFileSync(tempDataPath, JSON.stringify({
          imageDataList: validImages.slice(0, 5), // Only use first 5 valid images for validation
          instancePrompt,
          modelName: `test-${modelName}`,
          trainingSteps: 10, // Use minimal steps for validation
        }));
        
        // Run Modal validation with dry-run flag
        const modalCommand = `python3 -m modal run modal_scripts/train_model.py --input ${tempDataPath} --dry-run`;
        const { stdout, stderr } = await execPromise(modalCommand);
        
        console.log('Modal validation response:', stdout);
        
        if (stderr && stderr.includes('error')) {
          throw new Error(`Modal validation error: ${stderr}`);
        }
        
        // Clean up the temp file
        try {
          fs.unlinkSync(tempDataPath);
        } catch (unlinkError) {
          console.warn('Failed to delete temp validation file:', unlinkError);
        }
        
        // The validation is successful if we got here
        validationData.modelValidation = {
          success: true,
          message: 'Model training parameters validated successfully',
        };
      } else {
        validationData.modelValidation = {
          success: false,
          message: 'Not enough valid images for training (need at least 5)',
        };
      }
    } catch (error) {
      console.error('Error validating model with Modal:', error);
      validationData.modelValidation = {
        success: false,
        message: `Modal validation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    
    // Return validation results
    const status = validationData.warnings.length > 0 ? 'warning' : 'success';
    return NextResponse.json({
      status,
      validationData,
    });
    
  } catch (error) {
    console.error('Error in POST /api/modal/validate-model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ status: 'error', error: errorMessage }, { status: 500 });
  }
} 