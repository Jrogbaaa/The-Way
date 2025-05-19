// Utility script to check the status of a specific model in Supabase
// Run with: node scripts/check-model-status.js MODEL_ID

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

/**
 * Check the status of a specific model
 */
async function checkModelStatus(modelId) {
  try {
    console.log(`Checking status for model: ${modelId}`);
    
    // Get model information
    const { data, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();
    
    if (error) {
      console.error('Error fetching model:', error);
      return;
    }
    
    if (!data) {
      console.log(`No model found with ID: ${modelId}`);
      return;
    }
    
    console.log('\nModel details:');
    console.log(`ID: ${data.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Progress: ${data.progress}`);
    console.log(`Error message: ${data.error_message || 'None'}`);
    console.log(`Created at: ${data.created_at}`);
    
    // Log additional details if they exist
    if (data.model_info) {
      console.log('\nModel info:');
      console.log(JSON.stringify(data.model_info, null, 2));
    }
    
    if (data.model_url) {
      console.log(`\nModel URL: ${data.model_url}`);
    }
    
    if (data.sample_image) {
      console.log('\nSample image available: Yes');
    }
    
  } catch (e) {
    console.error('Error checking model status:', e);
  }
}

// Get model ID from command line argument
const modelId = process.argv[2];

if (!modelId) {
  console.error('Please provide a model ID as an argument. Example: node scripts/check-model-status.js MODEL_ID');
  process.exit(1);
}

checkModelStatus(modelId); 