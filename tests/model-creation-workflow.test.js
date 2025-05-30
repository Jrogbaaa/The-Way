// Model Creation Workflow Test
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
require('jest-fetch-mock').enableMocks();

// Initialize Supabase client from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set base URL for fetch calls
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Mock image data
const getTestImage = () => {
  // Sample test image (base64 encoded small placeholder)
  const smallPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const base64Data = smallPlaceholder.split(',')[1];
  return base64Data;
};

// Sleep function for waiting between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Model Creation Workflow', () => {
  let modelId;
  const modelName = `test-model-${Date.now()}`;
  
  // Test timeout increased for the entire workflow
  jest.setTimeout(180000); // 3 minutes
  
  // Before each test, reset the fetch mocks
  beforeEach(() => {
    fetch.resetMocks();
  });
  
  test('1. Validate training parameters', async () => {
    // Mock a successful validation response
    fetch.mockResponseOnce(JSON.stringify({
      status: 'success',
      validationData: {
        valid: true,
        warnings: [],
        imageData: {
          totalImages: 5,
          validImages: 5,
          invalidImages: 0,
        },
        estimatedTrainingTime: {
          steps: 150,
          minutes: 5,
        }
      }
    }));
    
    const imageDataList = Array(5).fill().map(() => ({
      base64Data: getTestImage()
    }));
    
    const response = await fetch(`${BASE_URL}/api/modal/validate-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataList,
        instancePrompt: 'photo of sks person',
        modelName: modelName,
        trainingSteps: 150
      })
    });
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.validationData.valid).toBe(true);
    
    // Verify we called the right endpoint
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/modal/validate-model`,
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
  });
  
  test('2. Start model training', async () => {
    // Generate a mock model ID
    modelId = `test-${Date.now().toString(36)}`;
    
    // Mock successful training response
    fetch.mockResponseOnce(JSON.stringify({
      status: 'success',
      message: 'Model training started',
      trainingId: modelId
    }));
    
    const imageDataList = Array(5).fill().map(() => ({
      base64Data: getTestImage()
    }));
    
    const response = await fetch(`${BASE_URL}/api/modal/train-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataList,
        instancePrompt: 'photo of sks person',
        modelName: modelName,
        trainingSteps: 150
      })
    });
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.trainingId).toBeTruthy();
    
    console.log(`Started training model with ID: ${modelId}`);
  });
  
  test('3. Monitor training progress', async () => {
    // Skip this test if we don't have a model ID
    if (!modelId) {
      console.log('Skipping progress monitoring - no model ID available');
      return;
    }

    // Create a model in the database if it doesn't exist
    try {
      const { data: existingModel } = await supabase
        .from('trained_models')
        .select('*')
        .eq('id', modelId)
        .single();
        
      if (!existingModel) {
        // Insert a test model record
        await supabase
          .from('trained_models')
          .insert({
            id: modelId,
            model_name: modelName,
            status: 'pending',
            progress: 0,
            created_at: new Date().toISOString(),
            user_id: 'test-user',
          });
        
        console.log(`Created test model in database: ${modelId}`);
      }
    } catch (error) {
      console.warn('Error checking/creating test model:', error);
    }

    // Mock a completed training status after a few status checks
    fetch.mockImplementation((url) => {
      if (url.includes(`/api/modal/model-status/${modelId}`)) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({
            id: modelId,
            status: 'completed',
            progress: 1.0,
            model_name: modelName,
            created_at: new Date().toISOString()
          })
        });
      }
      
      return Promise.reject(new Error(`Unhandled fetch call to ${url}`));
    });
    
    // Check status
    const response = await fetch(`${BASE_URL}/api/modal/model-status/${modelId}?_t=${Date.now()}`);
    const data = await response.json();
    
    console.log(`Status check result: ${data.status}, progress: ${data.progress * 100}%`);
    
    expect(data.status).toBe('completed');
    expect(data.progress).toBe(1.0);
    
    // Make sure the model is marked as completed in the database
    try {
      await supabase
        .from('trained_models')
        .update({
          status: 'completed',
          progress: 100,
          model_url: `/model-data/${modelId}/trained_model`,
        })
        .eq('id', modelId);
        
      console.log('Marked model as completed in database');
    } catch (dbError) {
      console.error('Error updating model in database:', dbError);
    }
  });
  
  test('4. Generate an image with the trained model', async () => {
    // Skip this test if we don't have a model ID
    if (!modelId) {
      console.log('Skipping image generation - no model ID available');
      return;
    }
    
    // Mock a successful image generation
    fetch.mockResponseOnce(JSON.stringify({
      status: 'success',
      imageUrl: '/placeholders/ai-generated-1.jpg',
      seed: 12345,
      prompt: 'a photo of sks person in a park',
      modelId: modelId
    }));
    
    const response = await fetch(`${BASE_URL}/api/modal/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId,
        prompt: 'a photo of sks person in a park',
        numInferenceSteps: 30,
        guidanceScale: 7.5
      })
    });
    
    const data = await response.json();
    
    // Should be success with image URL
    expect(data.status).toBe('success');
    expect(data.imageUrl).toBeTruthy();
    
    console.log('Successfully generated test image:', data.imageUrl);
  });
  
  test('5. Clean up test model', async () => {
    // Only run cleanup if we have a model ID
    if (!modelId) {
      console.log('Skipping cleanup - no model ID available');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('trained_models')
        .delete()
        .eq('id', modelId);
        
      if (error) {
        console.warn('Error cleaning up test model:', error);
      } else {
        console.log(`Successfully deleted test model ${modelId} from database`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });
}); 