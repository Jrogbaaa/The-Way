// Utility script to list all models in Supabase
// Run with: node scripts/list-all-models.js

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
 * List all models in the database
 */
async function listAllModels() {
  try {
    console.log('Fetching all models from database...');
    
    // Get all models, ordered by most recent first
    const { data, error } = await supabase
      .from('trained_models')
      .select('id, status, created_at, progress, error_message')
      .order('created_at', { ascending: false })
      .limit(20);  // Limit to 20 most recent models
    
    if (error) {
      console.error('Error fetching models:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No models found in the database.');
      return;
    }
    
    console.log(`\nFound ${data.length} models:`);
    console.log('\nID | Status | Progress | Created At | Error Message');
    console.log('-'.repeat(100));
    
    data.forEach(model => {
      const error = model.error_message ? 
        (model.error_message.length > 40 ? 
          model.error_message.substring(0, 40) + '...' : 
          model.error_message) : 
        'None';
      
      console.log(`${model.id} | ${model.status || 'unknown'} | ${model.progress || 0} | ${model.created_at} | ${error}`);
    });
    
  } catch (e) {
    console.error('Error listing models:', e);
  }
}

listAllModels(); 