require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Required environment variables are not defined:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

// Initialize with service role key to simulate server-side access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

const BUCKET_NAME = 'gallery-uploads';

// Generate a test user ID for simulating a specific user
const TEST_USER_ID = 'server-test-' + Math.random().toString(36).substring(2, 10);

// Test bucket existence and create if missing
async function ensureBucket() {
  console.log('=== Testing Supabase Storage with SERVICE ROLE ===');
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
      console.log(`⚠️ Bucket '${BUCKET_NAME}' does not exist. Creating it...`);
      
      const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        return false;
      }
      
      console.log(`✅ Bucket '${BUCKET_NAME}' created successfully.`);
      return true;
    }
  } catch (err) {
    console.error('Unexpected error checking/creating bucket:', err);
    return false;
  }
}

// Test uploading a file to the bucket
async function testUpload() {
  console.log('\nTesting upload to bucket with service role...');
  
  try {
    // Create a test file
    const dummyData = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const testFilePath = `${TEST_USER_ID}/test-server-${Date.now()}.bin`;
    
    console.log(`Uploading to path: ${testFilePath}`);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testFilePath, dummyData, {
        contentType: 'application/octet-stream',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload failed:', error.message);
      console.error('Error details:', error);
      return false;
    }
    
    console.log('✅ Upload succeeded with service role!');
    console.log('Upload result:', data);
    
    // Get and verify the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testFilePath);
    
    console.log('Public URL:', urlData?.publicUrl);
    
    // Verify that the service role can also get the private URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(testFilePath, 60); // 60 seconds expiry
    
    if (signedUrlError) {
      console.error('❌ Error creating signed URL:', signedUrlError.message);
    } else {
      console.log('✅ Signed URL created successfully:', signedUrlData?.signedUrl);
    }
    
    return testFilePath; // Return the path for cleanup
  } catch (err) {
    console.error('Unexpected error during upload test:', err);
    return null;
  }
}

// Test listing files in the bucket
async function testList() {
  console.log('\nTesting listing files in bucket with service role...');
  
  try {
    // List everything with service role
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(TEST_USER_ID, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error('❌ Listing failed:', error.message);
      return false;
    }
    
    console.log(`✅ Listed ${data.length} files in path '${TEST_USER_ID}':`);
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

// Test listing ALL files across all folders (admin view)
async function testAdminView() {
  console.log('\nTesting admin view of ALL files...');
  
  try {
    // List everything at root with service role
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0,
      });
    
    if (error) {
      console.error('❌ Admin listing failed:', error.message);
      return false;
    }
    
    console.log(`✅ Found ${data.length} folders/files at root level:`);
    if (data.length > 0) {
      data.forEach(item => {
        console.log(`- ${item.name} (${item.id})`);
      });
    } else {
      console.log('(no files/folders found)');
    }
    
    // If we have folders, look inside a few
    const folders = data.filter(item => !item.id); // Folders typically don't have IDs
    if (folders.length > 0) {
      const sampleFolder = folders[0].name;
      console.log(`\nLooking inside sample folder: ${sampleFolder}`);
      
      const { data: folderContents, error: folderError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(sampleFolder);
        
      if (folderError) {
        console.error(`❌ Error listing folder ${sampleFolder}:`, folderError.message);
      } else {
        console.log(`✅ Found ${folderContents.length} items in folder ${sampleFolder}:`);
        folderContents.forEach(item => {
          console.log(`- ${item.name} (${item.metadata?.size || 'unknown'} bytes)`);
        });
      }
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error in admin view:', err);
    return false;
  }
}

// Test policies by checking raw SQL
async function testPolicies() {
  console.log('\nChecking storage policy configuration in the database...');
  
  try {
    // This requires postgres schema access, which service role should have
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');
    
    if (error) {
      console.error('❌ Error querying policies:', error.message);
      console.log('Note: This may be because the service role lacks access to system tables.');
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No policies found for storage.objects. This may cause permission issues.');
      return false;
    }
    
    console.log(`✅ Found ${data.length} policies for storage.objects:`);
    data.forEach(policy => {
      console.log(`- ${policy.policyname}`);
      console.log(`  Command: ${policy.cmd || 'ALL'}`);
      console.log(`  Roles: ${policy.roles || 'ALL'}`);
      if (policy.qual) console.log(`  Using expression: ${policy.qual}`);
      if (policy.with_check) console.log(`  With check: ${policy.with_check}`);
      console.log('---');
    });
    
    return true;
  } catch (err) {
    console.error('Unexpected error checking policies:', err);
    return false;
  }
}

// Clean up test data
async function cleanup(filePath) {
  if (!filePath) return;
  
  console.log('\nCleaning up test files...');
  
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('❌ Error removing test file:', error.message);
    } else {
      console.log('✅ Test file removed successfully.');
    }
  } catch (err) {
    console.error('Unexpected error during cleanup:', err);
  }
}

// Run all tests
async function runTests() {
  try {
    const bucketExists = await ensureBucket();
    if (!bucketExists) {
      console.error('\n⛔ Cannot proceed with tests: bucket issue.');
      return;
    }
    
    const uploadedFilePath = await testUpload();
    const listResult = await testList();
    const adminViewResult = await testAdminView();
    const policiesResult = await testPolicies();
    
    // Clean up
    await cleanup(uploadedFilePath);
    
    // Summary
    console.log('\n=== Server Test Summary ===');
    console.log(`Bucket Exists/Created: ${bucketExists ? '✅' : '❌'}`);
    console.log(`Service Role Upload: ${uploadedFilePath ? '✅' : '❌'}`);
    console.log(`Listing Files: ${listResult ? '✅' : '❌'}`);
    console.log(`Admin View: ${adminViewResult ? '✅' : '❌'}`);
    console.log(`Policies Check: ${policiesResult ? '✅' : '❌'}`);
    
    // Recommendations based on test results
    console.log('\n=== Server-Side Recommendations ===');
    if (!uploadedFilePath) {
      console.log('❌ SERVICE ROLE CANNOT UPLOAD. This is a serious configuration issue.');
      console.log('1. Check your Supabase project configuration');
      console.log('2. Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
    } else if (!policiesResult) {
      console.log('⚠️ Unable to verify policies, but uploads work with service role.');
      console.log('1. Review storage.objects RLS policies in the Supabase dashboard SQL editor');
      console.log('2. Ensure policies allow authenticated users to CRUD in their own folders');
    } else {
      console.log('✅ Service role appears to have proper access to storage.');
      console.log('If client/API uploads are failing, check:');
      console.log('1. RLS policies for authenticated users (not service role)');
      console.log('2. Authentication in API routes');
      console.log('3. Client-side token management');
    }
  } catch (err) {
    console.error('Unexpected error during tests:', err);
  }
}

runTests(); 