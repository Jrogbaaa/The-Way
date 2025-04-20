require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBucket() {
  try {
    console.log('Checking for gallery-uploads bucket...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }
    
    const bucket = buckets.find(b => b.name === 'gallery-uploads');
    
    if (bucket) {
      console.log('✅ Bucket exists:', bucket);
    } else {
      console.log('❌ Bucket does not exist - creating it...');
      
      // Create the bucket if it doesn't exist
      const { data, error: createError } = await supabase.storage.createBucket('gallery-uploads', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError.message);
      } else {
        console.log('✅ Bucket created successfully');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkBucket(); 