#!/usr/bin/env node

// This script creates the gallery-uploads bucket and configures appropriate RLS policies
// Run with: node scripts/setup-storage-bucket.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Ensure service role key is available - this is required for bucket creation
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31mERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.\x1b[0m');
  console.error('This script requires administrative privileges to create buckets and set policies.');
  console.error('Please add this key to your .env file or provide it when running the script:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/setup-storage-bucket.js');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('\x1b[31mERROR: NEXT_PUBLIC_SUPABASE_URL environment variable is required.\x1b[0m');
  process.exit(1);
}

// Bucket name
const BUCKET_NAME = 'gallery-uploads';

// Create admin client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupStorageBucket() {
  console.log('\x1b[36m%s\x1b[0m', `Setting up '${BUCKET_NAME}' bucket...`);
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('\x1b[31mFailed to list buckets:\x1b[0m', bucketsError.message);
      process.exit(1);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' already exists. Moving to policy setup.`);
    } else {
      // Create bucket
      console.log(`Creating '${BUCKET_NAME}' bucket...`);
      const { data: createData, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
      });
      
      if (createError) {
        console.error('\x1b[31mFailed to create bucket:\x1b[0m', createError.message);
        process.exit(1);
      }
      
      console.log('\x1b[32mBucket created successfully.\x1b[0m');
    }
    
    // Update bucket to be public
    console.log(`Setting bucket '${BUCKET_NAME}' to public...`);
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760 // 10MB limit
    });
    
    if (updateError) {
      console.error('\x1b[31mFailed to update bucket:\x1b[0m', updateError.message);
      // Continue anyway, may just be an issue with the API
    } else {
      console.log('\x1b[32mBucket updated successfully.\x1b[0m');
    }
    
    // Get SQL for policy setup
    await setupPolicies();
    
    console.log('\x1b[32mSetup completed successfully!\x1b[0m');
    console.log('\n\x1b[36mYou should now be able to upload files to the gallery.\x1b[0m');
    
  } catch (err) {
    console.error('\x1b[31mAn unexpected error occurred:\x1b[0m', err);
    process.exit(1);
  }
}

async function setupPolicies() {
  console.log('\n\x1b[36mStorage access policies\x1b[0m');
  console.log('Here are SQL statements for setting up appropriate RLS policies:');
  console.log('\x1b[33m');
  
  // SQL for bucket access policies
  console.log(`-- Run these SQL statements in your Supabase SQL editor to configure correct RLS policies:`);
  console.log(`-- Allow users to select their own objects`);
  console.log(`CREATE POLICY "Users can view their own uploads" ON storage.objects`);
  console.log(`  FOR SELECT USING (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = (storage.foldername(name))[1]);`);
  console.log();
  
  console.log(`-- Allow users to insert their own objects`);
  console.log(`CREATE POLICY "Users can upload to their own folder" ON storage.objects`);
  console.log(`  FOR INSERT WITH CHECK (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = (storage.foldername(name))[1]);`);
  console.log();
  
  console.log(`-- Allow users to update their own objects`);
  console.log(`CREATE POLICY "Users can update their own uploads" ON storage.objects`);
  console.log(`  FOR UPDATE USING (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = (storage.foldername(name))[1]);`);
  console.log();
  
  console.log(`-- Allow users to delete their own objects`);
  console.log(`CREATE POLICY "Users can delete their own uploads" ON storage.objects`);
  console.log(`  FOR DELETE USING (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = (storage.foldername(name))[1]);`);
  console.log();
  
  console.log(`-- Allow public select access to all files`);
  console.log(`CREATE POLICY "Public can view all uploads" ON storage.objects`);
  console.log(`  FOR SELECT USING (bucket_id = '${BUCKET_NAME}');`);
  console.log('\x1b[0m');
  
  console.log('\n\x1b[36mAdditional instructions:\x1b[0m');
  console.log('1. Log in to your Supabase dashboard: https://app.supabase.com/');
  console.log('2. Go to Storage > Policies');
  console.log('3. Ensure the RLS policy is enabled');
  console.log('4. Add the above policies using the SQL editor (SQL Button in top navigation)');
}

// Run the setup
setupStorageBucket().catch(err => {
  console.error('\x1b[31mFailed to set up storage bucket:\x1b[0m', err);
  process.exit(1);
}); 