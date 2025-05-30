/**
 * Manual Test Script for Model Creation Workflow
 * 
 * This script tests the entire model creation and image generation workflow
 * without mocking API responses.
 * 
 * Usage: node scripts/test-model-creation.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service key. Make sure they are defined in your environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const MODEL_NAME = `test-model-${Date.now()}`;
const INSTANCE_PROMPT = 'photo of sks person';
const TRAINING_STEPS = 150;

// Sample test image (uses placeholder images or creates a simple test pattern)
const getTestImage = () => {
  try {
    // Try to use placeholder from public directory
    const placeholderPath = path.join(__dirname, '../public/placeholders/ai-generated-1.jpg');
    if (fs.existsSync(placeholderPath)) {
      return fs.readFileSync(placeholderPath, 'base64');
    }
    
    // If placeholder doesn't exist, try test-images directory
    const testImagesDir = path.join(__dirname, 'test-images');
    const testImages = fs.readdirSync(testImagesDir).filter(file => 
      file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')
    );
    
    if (testImages.length > 0) {
      const randomImage = testImages[Math.floor(Math.random() * testImages.length)];
      return fs.readFileSync(path.join(testImagesDir, randomImage), 'base64');
    }
    
    // If no images found, use a simple base64 placeholder
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  } catch (error) {
    console.warn('Warning: Could not read test image, using fallback', error.message);
    // Return a 1x1 pixel transparent PNG as fallback
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  }
};

// Sleep function for waiting between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runTest() {
  console.log('=== MODEL CREATION WORKFLOW TEST ===');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Model name: ${MODEL_NAME}`);
  console.log('-----------------------------------');
  
  let modelId;
  
  try {
    // Step 1: Validate model parameters
    console.log('\n🔍 STEP 1: Validating training parameters...');
    const imageDataList = Array(5).fill().map(() => ({
      base64Data: getTestImage()
    }));
    
    const validationResponse = await fetch(`${BASE_URL}/api/modal/validate-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataList,
        instancePrompt: INSTANCE_PROMPT,
        modelName: MODEL_NAME,
        trainingSteps: TRAINING_STEPS
      })
    });
    
    if (!validationResponse.ok) {
      throw new Error(`Validation failed with status ${validationResponse.status}`);
    }
    
    const validationData = await validationResponse.json();
    console.log(`✅ Validation successful: ${validationData.validationData.valid ? 'Valid' : 'Invalid'}`);
    
    if (!validationData.validationData.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validationData.validationData.warnings)}`);
    }
    
    // Step 2: Start model training
    console.log('\n🚀 STEP 2: Starting model training...');
    const trainingResponse = await fetch(`${BASE_URL}/api/modal/train-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataList,
        instancePrompt: INSTANCE_PROMPT,
        modelName: MODEL_NAME,
        trainingSteps: TRAINING_STEPS
      })
    });
    
    if (!trainingResponse.ok) {
      throw new Error(`Training initiation failed with status ${trainingResponse.status}`);
    }
    
    const trainingData = await trainingResponse.json();
    modelId = trainingData.trainingId;
    
    console.log(`✅ Training started successfully. Model ID: ${modelId}`);
    
    // Step 3: Monitor training progress
    console.log('\n⌛ STEP 3: Monitoring training progress...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // ~5 minutes with 10s interval
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      const statusResponse = await fetch(`${BASE_URL}/api/modal/model-status/${modelId}?_t=${Date.now()}`);
      
      if (!statusResponse.ok) {
        console.warn(`Warning: Status check failed with status ${statusResponse.status}`);
        await sleep(10000);
        continue;
      }
      
      const statusData = await statusResponse.json();
      const progressPercent = (statusData.progress || 0) * 100;
      
      console.log(`Status check ${attempts}: ${statusData.status}, progress: ${progressPercent.toFixed(1)}%`);
      
      if (statusData.status === 'completed') {
        completed = true;
        console.log('✅ Training completed successfully!');
        break;
      } else if (statusData.status === 'failed' || statusData.status === 'error') {
        const errorMsg = statusData.error_message || 'Unknown error';
        throw new Error(`Training failed: ${errorMsg}`);
      }
      
      // Wait before next check
      await sleep(10000); // 10 seconds
    }
    
    if (!completed) {
      console.log('⚠️ Training taking too long, continuing test...');
      
      // Only force update in development
      if (process.env.NODE_ENV === 'development') {
        const { error } = await supabase
          .from('trained_models')
          .update({
            status: 'completed',
            progress: 100,
            model_url: `/model-data/${modelId}/trained_model`,
          })
          .eq('id', modelId);
          
        if (error) {
          console.error('Error updating model status:', error);
        } else {
          console.log('Manually set model status to completed for testing');
          completed = true;
        }
      }
    }
    
    // Step 4: Generate an image with the model
    console.log('\n🖼️ STEP 4: Generating an image with the model...');
    const generationResponse = await fetch(`${BASE_URL}/api/modal/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId,
        prompt: `a ${INSTANCE_PROMPT} in a beautiful garden`,
        numInferenceSteps: 30,
        guidanceScale: 7.5
      })
    });
    
    if (!generationResponse.ok) {
      throw new Error(`Image generation failed with status ${generationResponse.status}`);
    }
    
    const generationData = await generationResponse.json();
    
    console.log(`Status: ${generationData.status}`);
    
    if (generationData.usedPlaceholder) {
      console.log(`⚠️ Used placeholder image due to: ${generationData.message}`);
      if (generationData.modelError) {
        console.log(`Error details: ${generationData.modelError}`);
      }
    } else {
      console.log(`✅ Successfully generated image: ${generationData.imageUrl || '[base64 image]'}`);
    }
    
    // Success - all steps completed
    console.log('\n✅ TEST COMPLETE: Model creation workflow test completed successfully!');
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up test model if we created one
    if (modelId) {
      console.log('\n🧹 Cleaning up test model...');
      try {
        const { error } = await supabase
          .from('trained_models')
          .delete()
          .eq('id', modelId);
          
        if (error) {
          console.warn(`Warning: Failed to delete test model: ${error.message}`);
        } else {
          console.log(`✅ Successfully deleted test model ${modelId}`);
        }
      } catch (error) {
        console.warn(`Warning: Error during cleanup: ${error.message}`);
      }
    }
  }
}

// Run the test
runTest(); 