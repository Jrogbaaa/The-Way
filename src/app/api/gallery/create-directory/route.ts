import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side API endpoint to create a directory in Supabase Storage
 * This can bypass certain RLS issues since it runs with server privileges
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase admin client with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' }, 
        { status: 500 }
      );
    }
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    
    // Get data from the request
    const { path, userId, bucketName = 'gallery-uploads' } = await request.json();
    
    // Validate parameters
    if (!path) {
      return NextResponse.json({ error: 'Missing required path parameter' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing required userId parameter' }, { status: 400 });
    }
    
    // Ensure path has a trailing slash for directories
    let folderPath = path;
    if (!folderPath.endsWith('/')) {
      folderPath += '/';
    }
    
    // Full path in storage
    const fullPath = `${userId}/${folderPath}.keep`;
    console.log(`Creating directory at: ${fullPath}`);
    
    // Check if bucket exists first
    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return NextResponse.json({ error: 'Error accessing storage: ' + bucketsError.message }, { status: 500 });
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        // Create the bucket if it doesn't exist
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: false
        });
        
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
          return NextResponse.json({ error: 'Error creating bucket: ' + createBucketError.message }, { status: 500 });
        }
      }
    } catch (bucketError: any) {
      console.error('Error checking/creating bucket:', bucketError);
      return NextResponse.json({ error: 'Error setting up storage: ' + bucketError.message }, { status: 500 });
    }
    
    // Create the directory by uploading a placeholder file
    try {
      console.log(`[Server API] Creating directory for user ${userId} at path: ${fullPath}`);

      // Use an empty Buffer instead of an empty string for more reliable uploads
      const emptyBuffer = Buffer.from('');
      
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fullPath, emptyBuffer, {
          contentType: 'text/plain',
          upsert: true,
        });
        
      if (error) {
        console.error('[Server API] Error creating directory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      console.log('[Server API] Directory created successfully');
      return NextResponse.json({ 
        success: true, 
        path: folderPath,
        data 
      });
    } catch (uploadError: any) {
      console.error('Error in upload operation:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Unexpected error in create-directory endpoint:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
} 