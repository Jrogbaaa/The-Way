require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check for environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined in your .env file');
  process.exit(1);
}

// Initialize with anonymous key first to test if bucket exists
const regularClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// This will be initialized only if SUPABASE_SERVICE_ROLE_KEY is available
let adminClient = null;

async function setupBucket() {
  try {
    console.log('Checking for gallery-uploads bucket...');
    
    // First check if bucket exists
    const { data: buckets, error } = await regularClient.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }
    
    const bucket = buckets.find(b => b.name === 'gallery-uploads');
    
    if (bucket) {
      console.log('✅ Bucket already exists:', bucket.name);
      return;
    }
    
    console.log('❌ Bucket does not exist. Attempting to create it...');
    
    // We need admin privileges to create a bucket
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('\n⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined in your .env file');
      console.error('To create the bucket, you need to:');
      console.error('1. Go to your Supabase dashboard: https://app.supabase.com');
      console.error('2. Select your project');
      console.error('3. Go to Project Settings > API');
      console.error('4. Copy the "service_role key" (NOT the anon key)');
      console.error('5. Add it to your .env file as: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
      console.error('\nOr create the bucket manually in the Supabase dashboard:');
      console.error('1. Go to Storage in the sidebar');
      console.error('2. Click "New bucket"');
      console.error('3. Name it "gallery-uploads"');
      console.error('4. Check "Public bucket" if you want files to be publicly accessible');
      return;
    }
    
    // Initialize admin client with service role key
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create the bucket with admin privileges
    const { data, error: createError } = await adminClient.storage.createBucket('gallery-uploads', {
      public: true,
      fileSizeLimit: 10485760, // 10MB limit
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError.message);
    } else {
      console.log('✅ Bucket "gallery-uploads" created successfully');
      console.log('\n✅ Now you need to apply the RLS policies from supabase-storage-policy.sql');
      console.log('Go to the SQL Editor in your Supabase dashboard and run the SQL statements');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

setupBucket(); 