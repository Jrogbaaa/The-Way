#!/usr/bin/env node

/**
 * Simple script to create the training-uploads bucket in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const main = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // First try to delete existing bucket if it exists
    console.log('Checking for existing training-uploads bucket...');
    const { error: deleteError } = await supabase.storage.deleteBucket('training-uploads');
    
    if (deleteError && !deleteError.message.includes('not found')) {
      console.log('Note: Could not delete existing bucket:', deleteError.message);
    } else if (!deleteError) {
      console.log('Deleted existing bucket');
    }
    
    console.log('Creating training-uploads bucket...');
    
    const { data, error } = await supabase.storage.createBucket('training-uploads', {
      public: true,
      fileSizeLimit: 52428800 // 50MB, no MIME type restrictions
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ training-uploads bucket already exists');
      } else {
        console.error('Error creating bucket:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ training-uploads bucket created successfully');
    }
    
    console.log('Bucket setup complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
};

main(); 