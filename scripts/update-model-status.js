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
const targetStatus = process.argv[3] || 'completed';

if (!modelId) {
  console.error('Usage: node scripts/update-model-status.js <modelId> [status]');
  console.error('Example: node scripts/update-model-status.js mb83ob15ka0jf completed');
  process.exit(1);
}

// Validate status
if (!['completed', 'failed', 'cancelled'].includes(targetStatus)) {
  console.error('Error: Invalid status. Must be one of: completed, failed, cancelled');
  process.exit(1);
}

// Update the status
async function updateModelStatus() {
  try {
    console.log(`Updating model ${modelId} status to ${targetStatus}...`);
    
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
    
    // Prepare update data based on status
    let updateData = {
      status: targetStatus,
    };
    
    if (targetStatus === 'completed') {
      updateData.progress = 100;
      updateData.model_info = {
        model_path: `/model-data/${existingModel.model_name}.zip`,
        training_completed: true
      };
      updateData.error_message = null;
    } else if (targetStatus === 'failed') {
      updateData.progress = existingModel.progress || 0;
      updateData.error_message = 'Training failed or timed out';
    } else if (targetStatus === 'cancelled') {
      updateData.progress = existingModel.progress || 0;
      updateData.error_message = 'Training cancelled by user or system';
    }
    
    // Update the model status
    const { error } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', modelId);
      
    if (error) {
      console.error('Error updating model status:', error);
      process.exit(1);
    }
    
    console.log(`Success! Model ${modelId} status updated to ${targetStatus}.`);
    
    if (targetStatus === 'completed') {
      console.log('You should now be able to see and use the model in the frontend.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateModelStatus(); 