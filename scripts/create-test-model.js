// Script to create a test model entry in Supabase
// Run with: node scripts/create-test-model.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create a test model ID with the same format as seen in the database
const generateTestId = () => {
  // Format appears to be "ma" + random alphanumeric chars
  return 'ma' + Math.random().toString(36).substring(2, 12);
};

// Insert a test model into the database
async function createTestModel() {
  try {
    const testId = generateTestId();
    const modelName = 'Test Model ' + new Date().toLocaleTimeString();
    
    console.log(`Creating test model with ID: ${testId}`);
    
    const { data, error } = await supabase
      .from('trained_models')
      .insert({
        id: testId,
        model_name: modelName,
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString(),
        user_id: 'test-user',
        input_data: {
          instancePrompt: 'a photo of sks test object',
          trainingSteps: 100,
          imageCount: 0
        }
      })
      .select();
    
    if (error) {
      console.error('Error creating test model:', error);
      return;
    }
    
    console.log('Test model created successfully!');
    console.log(`Model ID: ${testId}`);
    console.log('Use this ID in your test_input.json file for the modelId field');
    console.log('Model data:', data[0]);
    
    // Create a sample test_input.json file
    const fs = require('fs');
    const testInputPath = 'test_input.json';
    
    const testInputData = {
      modelId: testId,
      instancePrompt: 'a photo of sks test object',
      imageDataList: [],
      modelName: modelName,
      callbackUrl: "https://example.com/api/modal/training-progress", // Use a dummy URL
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    
    fs.writeFileSync(testInputPath, JSON.stringify(testInputData, null, 2));
    console.log(`\nCreated ${testInputPath} with the test model ID.`);
    console.log('Run the following command to test updating the model:');
    console.log(`python -m modal run modal_scripts/train_kohya.py --input ${testInputPath}`);
    
  } catch (e) {
    console.error('Error in createTestModel:', e);
  }
}

createTestModel(); 