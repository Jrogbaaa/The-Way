// Utility script to clean up stalled models in the trained_models table
// Run with: node scripts/cleanup-stalled-models.js

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
 * Mark stalled models as failed
 */
async function cleanupStalledModels() {
  try {
    console.log('Checking for stalled model trainings...');
    
    // Calculate the timestamp from 30 minutes ago
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    const cutoffTime = thirtyMinutesAgo.toISOString();

    console.log(`Using cutoff time: ${cutoffTime}`);
    
    // Get all models in pending/starting status
    const { data: stalledModels, error } = await supabase
      .from('trained_models')
      .select('id, status, created_at')
      .in('status', ['pending', 'starting', 'preprocessing', 'training']);
    
    if (error) {
      console.error('Error fetching models:', error);
      return;
    }
    
    console.log(`Found ${stalledModels?.length || 0} models with pending/starting/preprocessing/training status`);
    
    if (!stalledModels || stalledModels.length === 0) {
      console.log('No models to clean up. Exiting.');
      return;
    }
    
    // Filter models that have been stalled for more than 30 minutes based on creation time
    const actuallyStalled = stalledModels.filter(model => {
      if (!model.created_at) return true;  // No created_at timestamp (unlikely but possible)
      return new Date(model.created_at) < thirtyMinutesAgo;
    });
    
    console.log(`Of those, ${actuallyStalled.length} appear to be stalled (created more than 30 minutes ago)`);
    
    if (actuallyStalled.length > 0) {
      console.log('The following models will be marked as failed:');
      actuallyStalled.forEach(model => {
        console.log(`- ID: ${model.id}, Status: ${model.status}, Created At: ${model.created_at || 'Unknown'}`);
      });
      
      // Ask for confirmation
      console.log('\nDo you want to proceed with marking these models as failed? (y/n)');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('> ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log('Proceeding with cleanup...');
          
          // Update each stalled model
          let successCount = 0;
          let errorCount = 0;
          
          for (const model of actuallyStalled) {
            const errorMessage = `Training appears to be stalled. No updates received in over 30 minutes while in '${model.status}' status. Marked as failed by cleanup script.`;
            console.log(`Marking model ${model.id} as failed...`);
            
            const { error } = await supabase
              .from('trained_models')
              .update({
                status: 'failed',
                error_message: errorMessage
              })
              .eq('id', model.id);
            
            if (error) {
              console.error(`Failed to update model ${model.id}:`, error);
              errorCount++;
            } else {
              console.log(`Successfully marked model ${model.id} as failed`);
              successCount++;
            }
          }
          
          console.log(`\nCleanup complete: ${successCount} models marked as failed, ${errorCount} failures`);
          readline.close();
        } else {
          console.log('Operation cancelled.');
          readline.close();
        }
      });
    } else {
      console.log('No stalled models found. No action needed.');
    }
  } catch (e) {
    console.error('Error in cleanup script:', e);
  }
}

cleanupStalledModels(); 