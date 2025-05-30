import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { execPromise } from "@/lib/server/utils";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { auth } from '@/auth';


// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if credentials are available
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Helper function to ensure we always return a consistent JSON response
const createErrorResponse = (message: string, status: number = 500, details?: any) => {
  console.error(`API Error (${status}): ${message}`, details ? details : '');
  return NextResponse.json(
    { error: message, details: details || null },
    { status }
  );
};

// Function to check for Python dependencies
const checkPythonDependency = async (packageName: string): Promise<boolean> => {
  try {
    console.log(`Checking for Python package: ${packageName}...`);
    // Use pip list to check if the package is installed
    const { stdout } = await execPromise(`python3 -m pip freeze | grep -i ${packageName}`);
    console.log(`Package check result for ${packageName}: ${stdout.trim()}`);
    return stdout.trim().length > 0;
  } catch (error) {
    // grep returns non-zero exit code if nothing is found, which causes exec to throw
    console.log(`Package ${packageName} not found`);
    return false;
  }
};

// Function to handle Python module missing errors consistently
const handleMissingModule = (modelId: string, prompt: string, missingModule: string) => {
  console.log(`Using placeholder image because Python module '${missingModule}' is missing.`);
  
  // Use placeholders instead of failing
  const placeholderImages = [
    '/placeholders/ai-generated-1.jpg',
    '/placeholders/ai-generated-2.jpg',
    '/placeholders/ai-generated-3.jpg',
    '/placeholders/ai-generated-4.jpg',
    '/placeholders/ai-generated-5.jpg',
  ];
  
  const combinedString = modelId + prompt;
  const imageIndex = Math.abs(
    combinedString.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  ) % placeholderImages.length;
  
  const placeholderUrl = placeholderImages[imageIndex];
  
  return NextResponse.json({
    status: 'success',
    imageUrl: placeholderUrl,
    seed: Date.now(),
    message: `Using placeholder image because Python module '${missingModule}' is missing on the server. Please contact the administrator to install the required dependencies.`,
    prompt: prompt,
    modelId: modelId,
    usedPlaceholder: true,
    missingDependency: missingModule
  });
};

// Function to handle invalid model files
const handleInvalidModel = (modelId: string, prompt: string, errorMessage: string) => {
  console.log(`Using placeholder image because model is invalid. Error: ${errorMessage}`);
  
  // Use placeholders instead of failing
  const placeholderImages = [
    '/placeholders/ai-generated-1.jpg',
    '/placeholders/ai-generated-2.jpg',
    '/placeholders/ai-generated-3.jpg',
    '/placeholders/ai-generated-4.jpg',
    '/placeholders/ai-generated-5.jpg',
  ];
  
  const combinedString = modelId + prompt;
  const imageIndex = Math.abs(
    combinedString.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  ) % placeholderImages.length;
  
  const placeholderUrl = placeholderImages[imageIndex];
  
  return NextResponse.json({
    status: 'success',
    imageUrl: placeholderUrl,
    seed: Date.now(),
    message: `Using placeholder image because the model file is invalid or corrupted. The model may need to be retrained.`,
    prompt: prompt,
    modelId: modelId,
    usedPlaceholder: true,
    modelError: errorMessage,
    errorType: 'invalid_model'
  });
};

// Analytics functions
const recordGenerationAnalytics = async (userId: string, modelId: string, prompt: string, params: any, success: boolean, duration: number) => {
  if (!supabase) return;
  
  try {
    // Log to model_analytics table
    await supabase.from('model_analytics').insert({
      user_id: userId,
      model_id: modelId,
      prompt: prompt,
      parameters: params,
      success: success,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
    
    // Extract common prompt terms for analysis
    const promptKeywords = extractPromptKeywords(prompt);
    
    // Log to prompt_analytics table 
    await supabase.from('prompt_analytics').insert({
      model_id: modelId,
      keywords: promptKeywords,
      prompt_length: prompt.length,
      timestamp: new Date().toISOString()
    });
    
    console.log('Analytics data recorded successfully');
  } catch (error) {
    console.error('Error recording analytics:', error);
    // Non-critical error, continue execution
  }
};

// Helper to extract keywords from prompts
const extractPromptKeywords = (prompt: string): string[] => {
  // Simple keyword extraction (could be enhanced with NLP)
  const words = prompt.toLowerCase().split(/\s+/);
  const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'with', 'of', 'and', 'or', 'for'];
  
  // Filter out stop words and short words, take top 10 keywords
  return words
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 10);
};

export async function POST(req: NextRequest) {
  console.log('POST /api/modal/generate-image called');
  const startTime = Date.now();
  let body: any;
  
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
    body = await req.json();
    const { modelId, prompt, numInferenceSteps, guidanceScale, negativePrompt, seed } = body;
    
    if (!modelId) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing modelId parameter'
      }, { status: 400 });
    }
    
    if (!prompt) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing prompt parameter'
      }, { status: 400 });
    }
    
    // Save input data to a temporary file to pass to Modal
    const tempDir = path.join(os.tmpdir(), 'lora-inference');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempDataPath = path.join(tempDir, `inference_params_${Date.now()}.json`);
    
    // Prepare inference parameters
    const inferenceParams = {
      modelId,
      prompt,
      numInferenceSteps: numInferenceSteps || 30,
      guidanceScale: guidanceScale || 7.5,
      negativePrompt: negativePrompt || 'ugly, blurry, low quality, distorted',
      seed: seed || Math.floor(Math.random() * 1000000),
      userId // Include userId for tracking
    };
    
    fs.writeFileSync(tempDataPath, JSON.stringify(inferenceParams));
    
    // Activate the Modal environment and run the inference script
    const projectDir = process.cwd();
    const modalEnvBin = path.join(projectDir, 'modal-env', 'bin', 'python');
    
    console.log('Running Modal inference command with python path:', modalEnvBin);
    
    // Execute the Modal command using spawn for better process handling
    const modalProcess = spawn(modalEnvBin, [
      '-m', 
      'modal', 
      'run', 
      'modal_scripts/generate_image.py::main', 
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
      console.log('Modal inference output:', output);
    });
    
    modalProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error('Modal inference stderr:', error);
    });
    
    // Wait for the process to complete
    await new Promise<void>((resolve, reject) => {
      modalProcess.on('close', (code) => {
        console.log(`Modal inference process exited with code ${code}`);
        
        if (code !== 0) {
          console.error('Error running Modal inference command:', stderr);
          reject(new Error(`Modal inference process exited with code ${code}: ${stderr}`));
          return;
        }
        
        resolve();
      });
    });
    
    // Try to parse the result from stdout
    try {
      console.log('Full stdout from Modal:', stdout);
      console.log('Full stderr from Modal:', stderr);
      
      // First try to find JSON output
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      let result = null;
      
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
          console.log('Parsed JSON result:', result);
        } catch (jsonParseError) {
          console.log('Failed to parse JSON, trying alternative parsing');
        }
      }
      
      // If no JSON found or parsing failed, try to extract status from output
      if (!result) {
        console.log('No valid JSON found, attempting to parse status from output');
        
        // Check for status messages in the output
        if (stdout.includes('Generation completed with status: error')) {
          // Try to extract the error details
          let errorMessage = 'Unknown error occurred during generation';
          
          // Look for common error patterns
          if (stdout.includes('Model directory not found') || stderr.includes('Model directory not found')) {
            errorMessage = 'Model directory not found for ID: ' + modelId;
          } else if (stdout.includes('Adapter model not found') || stderr.includes('Adapter model not found')) {
            errorMessage = 'Adapter model not found. The model may have failed to train properly.';
          } else if (stdout.includes('No module named') || stderr.includes('No module named')) {
            const moduleMatch = (stdout + stderr).match(/No module named ['"]([^'"]+)['"]/);
            const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
            errorMessage = `Missing Python dependency: ${missingModule}`;
          }
          
          result = {
            status: 'error',
            error: errorMessage,
            model_id: modelId
          };
        } else if (stdout.includes('Generation completed with status: success')) {
          // This shouldn't happen since successful results should have JSON, but handle it
          result = {
            status: 'error',
            error: 'Generation completed but no image data was returned',
            model_id: modelId
          };
        } else {
          // Completely unknown state
          result = {
            status: 'error',
            error: 'Modal process completed but returned no recognizable output',
            details: 'stdout: ' + stdout.substring(0, 500),
            model_id: modelId
          };
        }
      }
      
      // Now handle the result (whether parsed from JSON or constructed)
      if (result) {
        // Check for model validation errors
        if (result.status === 'error') {
          // Check for invalid model file error
          if (result.error && (
              result.error.includes('LoRA adapter file is too small') ||
              result.error.includes('model may be corrupted') ||
              result.error.includes('Error while deserializing header')
          )) {
            return handleInvalidModel(modelId, prompt, result.error);
          }
          
          // Check for model not found errors
          if (result.error && (
              result.error.includes('Model directory not found') || 
              result.error.includes('Model not found') ||
              result.error.includes('not found in Modal volume') ||
              result.error.includes('Adapter model not found')
          )) {
            return handleInvalidModel(modelId, prompt, "Model files not found in storage. The model may have been deleted or failed to train properly.");
          }
          
          // Check for missing Python dependencies
          if (result.error && result.error.includes('No module named')) {
            const moduleMatch = result.error.match(/No module named ['"]([^'"]+)['"]/);
            const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
            return handleMissingModule(modelId, prompt, missingModule);
          }
          
          // For other errors, return the error directly
          return NextResponse.json(result, { status: 500 });
        }
        
        // Record analytics
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        await recordGenerationAnalytics(
          userId, 
          modelId, 
          prompt, 
          { 
            steps: numInferenceSteps, 
            guidance: guidanceScale,
            seed: seed || result.seed
          }, 
          result.status === 'success',
          duration
        );
        
        // Store the generation history in Supabase if configured
        if (supabase && result.status === 'success') {
          try {
            const { error: insertError } = await supabase
              .from('generated_images')
              .insert({
                user_id: userId,
                model_id: modelId,
                prompt,
                negative_prompt: negativePrompt,
                seed: result.seed || seed,
                steps: numInferenceSteps,
                guidance_scale: guidanceScale,
                image_data: result.image_base64
              });
              
            if (insertError) {
              console.error('Error inserting generation record:', insertError);
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
          }
        }
        
        // Clean up the temporary file
        try {
          fs.unlinkSync(tempDataPath);
        } catch (unlinkError) {
          console.error('Error removing temporary file:', unlinkError);
        }
        
        // Return the result
        return NextResponse.json(result);
      }
    } catch (parseError) {
      console.error('Error parsing Modal inference output:', parseError);
      
      // Record failed analytics
      const endTime = Date.now();
      const duration = endTime - startTime;
      await recordGenerationAnalytics(
        userId, 
        modelId, 
        prompt, 
        { 
          steps: numInferenceSteps, 
          guidance: guidanceScale,
          seed: seed
        }, 
        false,
        duration
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'Failed to parse inference results',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in POST /api/modal/generate-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Record error analytics if possible
    if (typeof body !== 'undefined') {
      const endTime = Date.now();
      const duration = endTime - startTime;
      try {
        await recordGenerationAnalytics(
          'anonymous', 
          body?.modelId || 'unknown', 
          body?.prompt || 'unknown', 
          { error: errorMessage }, 
          false,
          duration
        );
      } catch (analyticsError) {
        console.error('Error recording error analytics:', analyticsError);
      }
    }
    
    return NextResponse.json({
      status: 'error',
      error: errorMessage
    }, { status: 500 });
  }
} 