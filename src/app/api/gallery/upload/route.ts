import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

// Ensure this bucket name matches the one in your Supabase project
const BUCKET_NAME = 'gallery-uploads'; 

export async function POST(request: Request) {
  console.log('API Route /api/gallery/upload: POST request received.');
  // Await the cookies() call to resolve the Promise
  const cookieStore = await cookies();

  // Create Supabase client using the standard pattern for Route Handlers
  const supabase = createServerClient(
    API_CONFIG.supabaseUrl!,
    API_CONFIG.supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookieStore has a `set` method, use it.
          // Otherwise, ignore the cookie setting step.
          try {
             cookieStore.set({ name, value, ...options });
          } catch (error) {
             // The `set` method was called from a Server Component.
             // This can be ignored if you have middleware refreshing
             // user sessions.
             console.warn(`Failed to set cookie '${name}' from Route Handler: ${error}`);
          }
        },
        remove(name: string, options: CookieOptions) {
          // If the cookieStore has a `delete` method, use it.
          // Otherwise, ignore the cookie removal step.
           try {
             cookieStore.set({ name, value: '', ...options });
           } catch (error) {
             // The `delete` or `set` method was called from a Server Component.
             // This can be ignored if you have middleware refreshing
             // user sessions.
             console.warn(`Failed to remove cookie '${name}' from Route Handler: ${error}`);
           }
        },
      },
    }
  );

  console.log('API Route: Attempting to get user...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('API Route: Session error:', sessionError.message);
    return NextResponse.json({ error: 'Authentication session error' }, { status: 401 });
  }
  
  if (!session) {
    console.error('API Route: No active session found');
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('API Route: Auth error or no user found.', authError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('API Route: User authenticated:', user.id);

  // Check if the bucket exists, create if not
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('API Route: Error checking buckets:', bucketsError.message);
    return NextResponse.json({ error: 'Storage service error' }, { status: 500 });
  }
  
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log(`API Route: Bucket '${BUCKET_NAME}' not found, attempting to create...`);
    try {
      // Create bucket with public access
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('API Route: Error creating bucket:', error.message);
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 });
      }
      
      console.log(`API Route: Successfully created bucket '${BUCKET_NAME}'`);
      
      // Set bucket policy for RLS
      // This is optional as you likely want to set these via Supabase dashboard
      // for permanent configuration
    } catch (bucketError) {
      console.error('API Route: Bucket creation failed:', bucketError);
      return NextResponse.json({ error: 'Storage configuration error' }, { status: 500 });
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('API Route: No file found in request.');
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    console.log(`API Route: Received file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

    // Validate file type and size server-side as well
    if (!file.type.startsWith('image/')) {
      console.error('API Route: Invalid file type uploaded.');
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }
    // Example size limit (e.g., 10MB)
    if (file.size > 10 * 1024 * 1024) { 
        console.error('API Route: File size exceeds limit.');
        return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Create a unique path, e.g., using user ID and timestamp/filename
    // IMPORTANT: Using user ID in the path helps with setting up RLS policies
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    console.log(`API Route: Uploading to bucket '${BUCKET_NAME}' at path: ${filePath}`);

    // Include auth token in options when uploading
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('API Route: Supabase storage upload error:', uploadError.message);
      console.error('API Route: Storage error details:', JSON.stringify(uploadError));
      
      // Provide more specific error if possible
      let statusCode = 500;
      let errorMessage = uploadError.message;
      
      if (uploadError.message.includes('Bucket not found')) {
        statusCode = 404;
        errorMessage = 'Storage bucket not found';
      } else if (uploadError.message.includes('not authorized')) {
        statusCode = 401;
        errorMessage = 'Not authorized to upload to this bucket';
      } else if (uploadError.message.includes('mime type')) {
        statusCode = 400;
        errorMessage = 'Invalid file type';
      } else if (uploadError.message.includes('exceeds size limit')) {
        statusCode = 413;
        errorMessage = 'File size exceeds limit';
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: uploadError.message,
        stack: uploadError.stack
      }, { status: statusCode });
    }

    console.log('API Route: File uploaded successfully:', uploadData);

    // Get the public URL (assumes bucket is public or you have policies allowing reads)
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
    const publicUrl = urlData?.publicUrl;
    console.log('API Route: Public URL retrieved:', publicUrl);

    // --- Optional: Save metadata to database ---
    // If you have a 'gallery_items' table, you would insert here:
    /*
    const { error: dbError } = await supabase
      .from('gallery_items') // Replace with your actual table name
      .insert({
        user_id: user.id,
        file_path: filePath, // Store the path for potential future operations
        image_url: publicUrl, // Store the public URL for display
        title: file.name, // Default title
        // Add other relevant fields: description, tags, size, type etc.
      });

    if (dbError) {
      console.error('API Route: Error saving metadata to database:', dbError);
      // Decide if this should be a hard failure. Maybe just log it?
      // Consider deleting the uploaded file if DB insert fails to avoid orphans?
    }
    */
    // --- End Optional Database Save ---

    return NextResponse.json({ 
        success: true, 
        message: 'File uploaded successfully.', 
        path: filePath, 
        publicUrl: publicUrl 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Route: Upload Error (catch block):', errorMessage);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 