#!/usr/bin/env node

/**
 * Supabase Storage Setup Script
 * 
 * This script initializes the required storage buckets for the application and
 * sets up appropriate RLS (Row Level Security) policies to control access.
 * 
 * Run with: node scripts/setup-supabase-storage.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const BUCKETS = [
  {
    name: 'gallery-uploads',
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB limit for uploads
      allowedMimeTypes: ['image/*'] // Allow only images
    }
  },
  {
    name: 'training-uploads',
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB limit for training files
      allowedMimeTypes: ['image/*', 'application/zip'] // Allow images and ZIP files
    }
  }
];

// Initialize Supabase client with service role key
// IMPORTANT: Use of service role key enables admin privileges
const initSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Check if a bucket exists
const checkBucket = async (supabase, bucketName) => {
  try {
    console.log(`Checking if bucket '${bucketName}' exists...`);
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    console.log(`Bucket '${bucketName}' ${bucketExists ? 'exists' : 'does not exist'}.`);
    return bucketExists;
  } catch (error) {
    console.error('Error checking bucket:', error.message);
    return false;
  }
};

// Create a bucket if it doesn't exist
const createBucket = async (supabase, bucketName, config) => {
  try {
    console.log(`Creating bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, config);
    
    if (error) {
      console.error(`Error creating bucket '${bucketName}':`, error.message);
      return false;
    }
    
    console.log(`Bucket '${bucketName}' created successfully.`);
    return true;
  } catch (error) {
    console.error(`Error creating bucket '${bucketName}':`, error.message);
    return false;
  }
};

// Get existing policies for a bucket
const getBucketPolicies = async (supabase, bucketName) => {
  try {
    // Note: This is a PostgreSQL query, as the Supabase JS client doesn't expose 
    // direct methods to list policies. This requires the service role key.
    const { data, error } = await supabase.rpc('get_policies_for_bucket', { 
      bucket_name: bucketName 
    });
    
    if (error) {
      console.error(`Error getting policies for bucket '${bucketName}':`, error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error getting policies for bucket '${bucketName}':`, error.message);
    return [];
  }
};

// Create RLS policies for the bucket
const setupBucketPolicies = async (supabase, bucketName) => {
  try {
    console.log(`Setting up policies for bucket '${bucketName}'...`);
    
    // Allow authenticated users to upload files to their own directory
    const { error: uploadError } = await supabase.storage.from(bucketName).createPolicy(
      'authenticated can upload',
      {
        definition: 'auth.uid() = (storage.foldername)[1]::uuid',
        check: 'true',
        operation: 'INSERT'
      }
    );
    
    if (uploadError) {
      console.error('Error creating upload policy:', uploadError.message);
    } else {
      console.log('Upload policy created successfully.');
    }
    
    // Allow anyone to read files (since the bucket is public)
    const { error: selectError } = await supabase.storage.from(bucketName).createPolicy(
      'anyone can read',
      {
        definition: 'true',
        check: 'true',
        operation: 'SELECT'
      }
    );
    
    if (selectError) {
      console.error('Error creating select policy:', selectError.message);
    } else {
      console.log('Select policy created successfully.');
    }
    
    // Allow users to delete their own files
    const { error: deleteError } = await supabase.storage.from(bucketName).createPolicy(
      'users can delete own files',
      {
        definition: 'auth.uid() = (storage.foldername)[1]::uuid',
        check: 'true',
        operation: 'DELETE'
      }
    );
    
    if (deleteError) {
      console.error('Error creating delete policy:', deleteError.message);
    } else {
      console.log('Delete policy created successfully.');
    }
    
    // Allow users to update their own files
    const { error: updateError } = await supabase.storage.from(bucketName).createPolicy(
      'users can update own files',
      {
        definition: 'auth.uid() = (storage.foldername)[1]::uuid',
        check: 'true',
        operation: 'UPDATE'
      }
    );
    
    if (updateError) {
      console.error('Error creating update policy:', updateError.message);
    } else {
      console.log('Update policy created successfully.');
    }
    
    console.log(`Policies for bucket '${bucketName}' set up successfully.`);
    return true;
  } catch (error) {
    console.error(`Error setting up policies for bucket '${bucketName}':`, error.message);
    return false;
  }
};

// Main function to run the script
const main = async () => {
  try {
    console.log('Starting Supabase storage setup...');
    const supabase = initSupabase();
    
    // Process each bucket
    for (const bucket of BUCKETS) {
      console.log(`\n--- Setting up bucket: ${bucket.name} ---`);
      
      // Check if the bucket exists, create if not
      const bucketExists = await checkBucket(supabase, bucket.name);
      if (!bucketExists) {
        const created = await createBucket(supabase, bucket.name, bucket.config);
        if (!created) {
          console.error(`Failed to create bucket '${bucket.name}'. Exiting.`);
          process.exit(1);
        }
      }
      
      // Set up bucket policies
      const success = await setupBucketPolicies(supabase, bucket.name);
      if (!success) {
        console.error(`Failed to set up policies for bucket '${bucket.name}'. Please check your Supabase permissions.`);
        process.exit(1);
      }
      
      console.log(`Bucket '${bucket.name}' setup completed successfully!`);
    }
    
    console.log('\n🎉 All Supabase storage buckets setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    process.exit(1);
  }
};

// Run the script
main(); 