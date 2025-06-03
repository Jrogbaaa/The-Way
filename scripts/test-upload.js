#!/usr/bin/env node

/**
 * Test script to verify training uploads functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
    console.log('Testing training-uploads bucket...');
    
    // Create a simple test file
    const testData = Buffer.from('Hello, this is a test file for training uploads!', 'utf8');
    const testPath = `training/test-session/test-${Date.now()}.txt`;
    
    console.log('Uploading test file...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-uploads')
      .upload(testPath, testData, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      process.exit(1);
    }

    console.log('✅ Upload successful:', uploadData.path);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('training-uploads')
      .getPublicUrl(testPath);

    console.log('✅ Public URL:', publicUrlData.publicUrl);
    
    // Clean up test file
    console.log('Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('training-uploads')
      .remove([testPath]);
      
    if (deleteError) {
      console.warn('Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('🎉 Training uploads test completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
};

main(); 