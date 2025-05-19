/**
 * Script to set up analytics tables in Supabase
 * 
 * Usage:
 * 1. Make sure your .env file contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 2. Run this script with: node scripts/setup-analytics-tables.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please make sure these are set in your .env.local file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAnalyticsTables() {
  console.log('Setting up analytics tables in Supabase...');

  try {
    // Create model_analytics table
    const { error: modelAnalyticsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'model_analytics',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        parameters JSONB,
        success BOOLEAN DEFAULT TRUE,
        duration_ms INTEGER NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      `
    });

    if (modelAnalyticsError) {
      console.error('Error creating model_analytics table:', modelAnalyticsError);
    } else {
      console.log('✅ model_analytics table created or already exists');
    }

    // Create prompt_analytics table
    const { error: promptAnalyticsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'prompt_analytics',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        model_id TEXT NOT NULL,
        keywords TEXT[] NOT NULL,
        prompt_length INTEGER NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      `
    });

    if (promptAnalyticsError) {
      console.error('Error creating prompt_analytics table:', promptAnalyticsError);
    } else {
      console.log('✅ prompt_analytics table created or already exists');
    }

    // Create training_analytics table
    const { error: trainingAnalyticsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'training_analytics',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        image_count INTEGER NOT NULL,
        training_time INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      `
    });

    if (trainingAnalyticsError) {
      console.error('Error creating training_analytics table:', trainingAnalyticsError);
    } else {
      console.log('✅ training_analytics table created or already exists');
    }

    // Set up Row Level Security policies
    
    // For model_analytics - allow users to see only their own analytics
    const { error: modelRlsError } = await supabase.rpc('create_rls_policy', {
      table_name: 'model_analytics',
      policy_name: 'users_own_analytics',
      definition: `
        CREATE POLICY users_own_analytics ON model_analytics 
        FOR SELECT USING (auth.uid() = user_id);
      `
    });

    if (modelRlsError) {
      console.error('Error setting up RLS for model_analytics:', modelRlsError);
    } else {
      console.log('✅ RLS policy created for model_analytics');
    }

    // Same for training_analytics
    const { error: trainingRlsError } = await supabase.rpc('create_rls_policy', {
      table_name: 'training_analytics',
      policy_name: 'users_own_training',
      definition: `
        CREATE POLICY users_own_training ON training_analytics 
        FOR SELECT USING (auth.uid() = user_id);
      `
    });

    if (trainingRlsError) {
      console.error('Error setting up RLS for training_analytics:', trainingRlsError);
    } else {
      console.log('✅ RLS policy created for training_analytics');
    }

    console.log('🎉 Analytics tables setup complete!');

  } catch (error) {
    console.error('Error setting up analytics tables:', error);
    process.exit(1);
  }
}

// Run the setup
setupAnalyticsTables(); 