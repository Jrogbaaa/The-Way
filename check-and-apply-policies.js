require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined in your .env file');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined in your .env file');
  console.error('You need this key to manage storage policies.');
  console.error('1. Go to your Supabase dashboard: https://app.supabase.com');
  console.error('2. Select your project');
  console.error('3. Go to Project Settings > API');
  console.error('4. Copy the "service_role key" (NOT the anon key)');
  console.error('5. Add it to your .env file as: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Initialize admin client with service role key
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = 'gallery-uploads';

async function checkAndApplyPolicies() {
  try {
    console.log('\n📦 Checking bucket configuration...');
    
    // Ensure bucket exists and is correctly configured
    const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const bucket = buckets.find(b => b.name === BUCKET_NAME);
    
    if (!bucket) {
      console.error(`Bucket "${BUCKET_NAME}" not found!`);
      return;
    }
    
    console.log(`✅ Bucket "${BUCKET_NAME}" exists with configuration:`, bucket);
    
    // Update bucket to ensure it's public
    const { error: updateError } = await adminClient.storage.updateBucket(BUCKET_NAME, { 
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (updateError) {
      console.error('Error updating bucket:', updateError);
    } else {
      console.log(`✅ Updated bucket "${BUCKET_NAME}" to be public with 10MB file limit`);
    }
    
    // Check for SQL queries directly
    console.log('\n🔒 You need to apply the RLS policies in the Supabase dashboard SQL editor:');
    console.log(`--- COPY AND PASTE THIS SQL INTO THE SQL EDITOR ---\n`);
    console.log(`-- Enable RLS on storage.objects`);
    console.log(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
    console.log();
    console.log(`-- Allow users to insert (upload) files to their own folder`);
    console.log(`CREATE POLICY "Users can upload files to their own folder"`);
    console.log(`ON storage.objects FOR INSERT`);
    console.log(`WITH CHECK (`);
    console.log(`  bucket_id = '${BUCKET_NAME}' AND `);
    console.log(`  auth.uid()::text = (storage.foldername(name))[1]`);
    console.log(`);`);
    console.log();
    console.log(`-- Allow users to update their own files`);
    console.log(`CREATE POLICY "Users can update their own files"`);
    console.log(`ON storage.objects FOR UPDATE`);
    console.log(`USING (`);
    console.log(`  bucket_id = '${BUCKET_NAME}' AND `);
    console.log(`  auth.uid()::text = (storage.foldername(name))[1]`);
    console.log(`);`);
    console.log();
    console.log(`-- Allow users to delete their own files`);
    console.log(`CREATE POLICY "Users can delete their own files"`);
    console.log(`ON storage.objects FOR DELETE`);
    console.log(`USING (`);
    console.log(`  bucket_id = '${BUCKET_NAME}' AND `);
    console.log(`  auth.uid()::text = (storage.foldername(name))[1]`);
    console.log(`);`);
    console.log();
    console.log(`-- Allow public viewing of all files`);
    console.log(`CREATE POLICY "Public can view all gallery files"`);
    console.log(`ON storage.objects FOR SELECT`);
    console.log(`USING (bucket_id = '${BUCKET_NAME}');`);
    console.log(`\n--- END SQL ---\n`);
    
    console.log('Once you\'ve applied these policies, your uploads should work!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkAndApplyPolicies(); 