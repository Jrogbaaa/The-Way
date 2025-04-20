require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined in your .env file');
  process.exit(1);
}

// Initialize with admin privileges if available
const client = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

const BUCKET_NAME = 'gallery-uploads';

// Test uploading a small file to the bucket to check policies
async function testUpload() {
  try {
    console.log('Testing upload to bucket with current policies...');

    // Create a dummy file
    const dummyData = new Uint8Array([0, 1, 2, 3, 4]);
    const testFilePath = `test-policy-${Date.now()}.bin`;

    // Attempt to upload
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(testFilePath, dummyData, {
        contentType: 'application/octet-stream',
      });

    if (error) {
      console.error('❌ Upload failed:', error.message);
      if (error.message.includes('row-level security policy')) {
        console.error('\n🔒 This confirms there is an RLS policy problem.\n');
        console.log('Please run the SQL from update-storage-policy.sql in your Supabase SQL editor.');
      }
    } else {
      console.log('✅ Upload succeeded! The policies seem to be working.');
      
      // Clean up test file
      const { error: deleteError } = await client.storage
        .from(BUCKET_NAME)
        .remove([testFilePath]);
        
      if (deleteError) {
        console.error('Error deleting test file:', deleteError.message);
      } else {
        console.log('Test file cleaned up successfully.');
      }
    }

    // List existing policies for information
    console.log('\nHere are the SQL commands you need to run in the Supabase dashboard SQL editor:');
    console.log('---');
    console.log(fs.readFileSync('update-storage-policy.sql', 'utf8'));
    console.log('---');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testUpload(); 