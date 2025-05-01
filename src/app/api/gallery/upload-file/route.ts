import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side API endpoint to upload files to Supabase Storage
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
    
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const path = formData.get('path') as string;
    const fileName = formData.get('fileName') as string;
    const bucketName = (formData.get('bucketName') as string) || 'gallery-uploads';
    
    // Validate parameters
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing required userId parameter' }, { status: 400 });
    }
    
    // Check if file is a valid File or Blob object
    const isValidFile = typeof file === 'object' && file !== null && 
                       ('arrayBuffer' in file) && typeof file.arrayBuffer === 'function';
    
    if (!isValidFile) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }
    
    // Full path in storage
    const originalFilename = fileName || file.name;
    
    // Sanitize the filename - replace spaces and special characters
    const sanitizedFilename = originalFilename
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Remove any other special characters
      .toLowerCase();                  // Convert to lowercase for consistency
    
    const filePath = `${userId}/${path || ''}${sanitizedFilename}`;
    console.log(`[Server API] Original filename: "${originalFilename}"`);
    console.log(`[Server API] Sanitized filename: "${sanitizedFilename}"`);
    console.log(`[Server API] Uploading file to path: ${filePath}`);
    
    // Log file details for debugging
    console.log(`[Server API] File type: ${file.type}, size: ${file.size} bytes`);
    
    // Check if bucket exists or create it
    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[Server API] Error listing buckets:', bucketsError);
        return NextResponse.json({ error: 'Error accessing storage: ' + bucketsError.message }, { status: 500 });
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        // Create the bucket if it doesn't exist
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: false
        });
        
        if (createBucketError) {
          console.error('[Server API] Error creating bucket:', createBucketError);
          return NextResponse.json({ error: 'Error creating bucket: ' + createBucketError.message }, { status: 500 });
        }
        
        console.log(`[Server API] Created bucket: ${bucketName}`);
      }
    } catch (bucketError: any) {
      console.error('[Server API] Error checking/creating bucket:', bucketError);
      return NextResponse.json({ error: 'Error setting up storage: ' + bucketError.message }, { status: 500 });
    }
    
    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();
    
    // Upload the file
    try {
      // For debugging - log upload attempt details
      console.log(`[Server API] Attempting upload to bucket: ${bucketName} with content type: ${file.type}`);
      
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });
        
      if (error) {
        // Enhanced error logging
        let errorDetails;
        try {
          errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch (e) {
          errorDetails = String(error);
        }
        
        console.error('[Server API] Error uploading file:', errorDetails);
        return NextResponse.json({ 
          error: error.message || 'Unknown upload error',
          details: errorDetails,
          fileInfo: {
            type: file.type,
            size: file.size,
            name: sanitizedFilename
          }
        }, { status: 500 });
      }
      
      // Generate a signed URL for the uploaded file
      const { data: urlData, error: urlError } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600);
        
      let signedUrl = null;
      if (urlError) {
        console.warn('[Server API] Could not generate signed URL:', urlError);
      } else {
        signedUrl = urlData?.signedUrl;
      }
      
      console.log('[Server API] File uploaded successfully');
      return NextResponse.json({ 
        success: true, 
        path: filePath,
        url: signedUrl,
        data 
      });
    } catch (uploadError: any) {
      console.error('[Server API] Error in upload operation:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[Server API] Unexpected error in upload-file endpoint:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// Override default body size limit for file uploads (default is 4MB)
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
}; 