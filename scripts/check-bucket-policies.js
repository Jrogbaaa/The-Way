#!/usr/bin/env node

/**
 * Check Supabase Storage Bucket Policies
 * 
 * This script connects to your Supabase instance and checks
 * the existing storage bucket configurations and permissions.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const BUCKET_NAME = 'gallery-uploads';

// Initialize Supabase client with service role key
const initSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Check bucket existence and details
const checkBucket = async (supabase, bucketName) => {
  try {
    console.log(`Checking if bucket '${bucketName}' exists...`);
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return false;
    }
    
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket) {
      console.log(`Bucket '${bucketName}' exists with properties:`);
      console.log(JSON.stringify(bucket, null, 2));
      return true;
    } else {
      console.log(`Bucket '${bucketName}' does not exist.`);
      return false;
    }
  } catch (error) {
    console.error('Error checking bucket:', error.message);
    return false;
  }
};

// Check files in the bucket
const listFiles = async (supabase, bucketName) => {
  try {
    console.log(`Listing files in bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (error) {
      console.error(`Error listing files in bucket '${bucketName}':`, error.message);
      return;
    }
    
    console.log(`Found ${data.length} files/folders in the root of bucket '${bucketName}':`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error listing files in bucket '${bucketName}':`, error.message);
  }
};

// Test bucket operations
const testBucketOperations = async (supabase, bucketName) => {
  try {
    console.log(`Testing bucket operations for '${bucketName}'...`);
    
    // Check if we can list files (SELECT permission)
    console.log('Testing SELECT permission...');
    const { data: listData, error: listError } = await supabase.storage
      .from(bucketName)
      .list();
      
    if (listError) {
      console.error('SELECT test failed:', listError.message);
    } else {
      console.log('SELECT test succeeded.');
    }
    
    // Create a test file (INSERT permission)
    console.log('Testing INSERT permission...');
    const testFileName = `test-${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, 'This is a test file');
      
    if (uploadError) {
      console.error('INSERT test failed:', uploadError.message);
    } else {
      console.log('INSERT test succeeded.');
      
      // Test UPDATE permission
      console.log('Testing UPDATE permission...');
      const { error: updateError } = await supabase.storage
        .from(bucketName)
        .update(testFileName, 'This is an updated test file');
        
      if (updateError) {
        console.error('UPDATE test failed:', updateError.message);
      } else {
        console.log('UPDATE test succeeded.');
      }
      
      // Test DELETE permission
      console.log('Testing DELETE permission...');
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([testFileName]);
        
      if (deleteError) {
        console.error('DELETE test failed:', deleteError.message);
      } else {
        console.log('DELETE test succeeded.');
      }
    }
  } catch (error) {
    console.error('Error testing bucket operations:', error.message);
  }
};

// Main function to run the script
const main = async () => {
  try {
    console.log('Starting Supabase storage check...');
    const supabase = initSupabase();
    
    // Check if the bucket exists
    const bucketExists = await checkBucket(supabase, BUCKET_NAME);
    if (bucketExists) {
      // List files in the bucket
      await listFiles(supabase, BUCKET_NAME);
      
      // Test bucket operations
      await testBucketOperations(supabase, BUCKET_NAME);
    }
    
    console.log('Storage check completed.');
    process.exit(0);
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    process.exit(1);
  }
};

// Run the script
main(); 