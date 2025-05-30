// Script to update model status in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service key. Make sure they are defined in your environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get model ID from command line arguments
const modelId = process.argv[2];

if (!modelId) {
  console.error('Usage: node update-model-status.js <modelId>');
  process.exit(1);
}

// Update the status to completed
async function updateModelStatus() {
  try {
    console.log(`Updating model ${modelId} status to completed...`);
    
    // First check if the model exists
    const { data: existingModel, error: fetchError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();
      
    if (fetchError) {
      console.error(`Error: Model with ID ${modelId} not found.`);
      process.exit(1);
    }
    
    console.log(`Found model: ${existingModel.model_name} (${modelId})`);
    console.log(`Current status: ${existingModel.status}`);
    
    // Update the model status to completed
    const { data, error } = await supabase
      .from('trained_models')
      .update({
        status: 'completed',
        progress: 100,
        model_url: `/model-data/${modelId}/trained_model`,
        error_message: null,
      })
      .eq('id', modelId);
      
    if (error) {
      console.error('Error updating model status:', error);
      process.exit(1);
    }
    
    console.log(`Success! Model ${modelId} status updated to completed.`);
    console.log('You should now be able to see the model in the frontend.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateModelStatus(); 