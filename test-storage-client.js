require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined in your .env file');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in your .env file');
  process.exit(1);
}

// Initialize with anon key to simulate client-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BUCKET_NAME = 'gallery-uploads';

// Test bucket existence first
async function testBucket() {
  console.log('=== Testing Supabase Storage with client credentials ===');
  console.log(`Checking if bucket '${BUCKET_NAME}' exists...`);
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return false;
    }
    
    const foundBucket = buckets.find(b => b.name === BUCKET_NAME);
    
    if (foundBucket) {
      console.log(`✅ Bucket '${BUCKET_NAME}' exists.`);
      console.log('Bucket details:', foundBucket);
      return true;
    } else {
      console.error(`❌ Bucket '${BUCKET_NAME}' does not exist!`);
      console.log('Available buckets:', buckets.map(b => b.name).join(', '));
      return false;
    }
  } catch (err) {
    console.error('Unexpected error checking bucket:', err);
    return false;
  }
}

// Test authentication
async function testAuth() {
  console.log('\nChecking authentication status...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error.message);
      return null;
    }
    
    if (!session) {
      console.log('ℹ️ No active session. Using anonymous access.');
      return null;
    }
    
    console.log(`✅ Authenticated as: ${session.user.email || session.user.id}`);
    return session.user;
  } catch (err) {
    console.error('Unexpected error checking auth:', err);
    return null;
  }
}

// Test uploading a small file to the bucket
async function testUpload(user) {
  console.log('\nTesting upload to bucket...');
  
  try {
    // Create a small test file
    const dummyData = new Uint8Array([0, 1, 2, 3, 4]);
    
    // Use user ID in path if authenticated, or 'anonymous' if not
    const userId = user ? user.id : 'anonymous';
    const testFilePath = `${userId}/test-client-${Date.now()}.bin`;
    
    console.log(`Uploading to path: ${testFilePath}`);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testFilePath, dummyData, {
        contentType: 'application/octet-stream',
      });
    
    if (error) {
      console.error('❌ Upload failed:', error.message);
      console.error('Error details:', error);
      
      if (error.message.includes('new row violates row-level security')) {
        console.error('\n🔒 This confirms there is an RLS policy problem for this user/path.');
        return false;
      }
      
      if (error.message.includes('JWT')) {
        console.error('\n🔑 This appears to be an authentication issue with the JWT token.');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ Upload succeeded!');
    console.log('Upload result:', data);
    
    // Clean up the test file
    console.log('\nCleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([testFilePath]);
    
    if (deleteError) {
      console.error('Error deleting test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up successfully.');
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error during upload test:', err);
    return false;
  }
}

// Test listing files in the bucket
async function testList(user) {
  console.log('\nTesting listing files in bucket...');
  
  try {
    // Use user ID in path if authenticated, or list root if not
    const path = user ? user.id : '';
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path);
    
    if (error) {
      console.error('❌ Listing failed:', error.message);
      return false;
    }
    
    console.log(`✅ Listed ${data.length} files in path '${path}':`);
    if (data.length > 0) {
      data.forEach(item => {
        console.log(`- ${item.name} (${item.metadata?.size || 'unknown'} bytes)`);
      });
    } else {
      console.log('(no files found)');
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error listing files:', err);
    return false;
  }
}

// Run all tests in sequence
async function runTests() {
  try {
    // Check if bucket exists
    const bucketExists = await testBucket();
    if (!bucketExists) {
      console.error('\n⛔ Cannot proceed with tests: bucket does not exist.');
      return;
    }
    
    // Check authentication status
    const user = await testAuth();
    
    // Test uploading
    const uploadResult = await testUpload(user);
    
    // Test listing
    const listResult = await testList(user);
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Bucket Exists: ${bucketExists ? '✅' : '❌'}`);
    console.log(`Authentication: ${user ? '✅ Authenticated' : 'ℹ️ Anonymous'}`);
    console.log(`Upload Test: ${uploadResult ? '✅' : '❌'}`);
    console.log(`List Test: ${listResult ? '✅' : '❌'}`);
    
    // Recommendations
    console.log('\n=== Recommendations ===');
    if (!uploadResult) {
      console.log('1. Check your RLS policies for the storage.objects table');
      console.log('2. Verify the user has proper permissions for their own folder');
      console.log('3. Run the SQL from update-storage-policy.sql to fix common permission issues');
    } else {
      console.log('Storage appears to be correctly configured from a client perspective.');
      console.log('If your API uploads are failing, check:');
      console.log('1. Authentication in the API route (cookies/session may not be properly passing)');
      console.log('2. Middleware configuration for API routes');
      console.log('3. Network request headers (Authorization, credentials: include, etc.)');
    }
  } catch (err) {
    console.error('Unexpected error during tests:', err);
  }
}

runTests(); 