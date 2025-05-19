#!/usr/bin/env node
// check-model-status.js
// Script to check the status of a model in Supabase

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get model ID from command line arguments
const modelId = process.argv[2];

if (!modelId) {
  console.error('Error: Model ID is required');
  console.error('Usage: node check-model-status.js <modelId>');
  process.exit(1);
}

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables are required');
  console.error('Please set them in your .env file or export them in your shell');
  process.exit(1);
}

async function checkModelStatus() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query the trained_models table
    const { data, error } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', modelId)
      .single();
    
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }
    
    if (!data) {
      console.log(`No model found with ID: ${modelId}`);
      return;
    }
    
    // Display model information
    console.log('\n=== Model Status ===');
    console.log(`Model ID: ${data.id}`);
    console.log(`Name: ${data.name || 'Unnamed'}`);
    console.log(`Status: ${data.status || 'unknown'}`);
    
    // Show progress if available
    if (data.progress !== null && data.progress !== undefined) {
      const progressBar = createProgressBar(data.progress);
      console.log(`Progress: ${data.progress}% ${progressBar}`);
    }
    
    // Show error message if failed
    if (data.status === 'failed' && data.error_message) {
      console.log(`Error: ${data.error_message}`);
    }
    
    // Show additional info if available
    if (data.model_info) {
      console.log('\n=== Model Info ===');
      Object.entries(data.model_info).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    
    // Print a specific message based on status
    if (data.status === 'starting') {
      console.log('\nModel training is initializing...');
    } else if (data.status === 'processing') {
      console.log('\nProcessing training images...');
    } else if (data.status === 'training') {
      console.log('\nModel is currently training...');
      if (data.model_info && data.model_info.currentStep && data.model_info.totalSteps) {
        console.log(`Step ${data.model_info.currentStep}/${data.model_info.totalSteps}`);
      }
    } else if (data.status === 'completed') {
      console.log('\nModel training completed successfully!');
      console.log(`Model URL: ${data.model_url || 'Not available'}`);
    } else if (data.status === 'failed') {
      console.log('\nModel training failed.');
    }

    return data.status;
  } catch (error) {
    console.error('Error checking model status:', error.message);
    process.exit(1);
  }
}

// Helper function to create a visual progress bar
function createProgressBar(progress, width = 30) {
  const completed = Math.round((progress / 100) * width);
  const remaining = width - completed;
  return `[${'='.repeat(completed)}${' '.repeat(remaining)}]`;
}

// Main execution
checkModelStatus()
  .then(status => {
    // Exit with proper code based on status
    if (status === 'failed') {
      process.exit(2);
    } else if (status === 'completed') {
      process.exit(0);
    } else {
      // For in-progress statuses
      process.exit(3);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 