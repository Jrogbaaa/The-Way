import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

// Ensure this bucket name matches the one in your Supabase project
const BUCKET_NAME = 'gallery-uploads'; 

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds window
const MAX_REQUESTS_PER_WINDOW = 20; // Max 20 upload requests per minute

// Rate limiting implementation using in-memory Map
// NOTE: This will reset on server restart and doesn't work across multiple instances
const requestLog = new Map<string, number[]>();

// Helper function to check rate limit
const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Get existing timestamps for this identifier or create new array
  const timestamps = requestLog.get(identifier) || [];
  
  // Filter out timestamps outside the current window
  const recentTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
  
  // Add current timestamp
  recentTimestamps.push(now);
  
  // Update the log
  requestLog.set(identifier, recentTimestamps);
  
  // Return whether the number of recent requests is within limit
  return recentTimestamps.length <= MAX_REQUESTS_PER_WINDOW;
};

// Helper to sanitize the path prefix to ensure it's valid
const sanitizePathPrefix = (prefix: string): string => {
  // Remove any leading or trailing slashes
  prefix = prefix.replace(/^\/+|\/+$/g, '');
  
  // Replace any multiple slashes with a single slash
  prefix = prefix.replace(/\/+/g, '/');
  
  // Remove any potentially dangerous path components
  prefix = prefix.replace(/\.\.\//g, '');
  
  return prefix;
};

export async function POST(request: NextRequest) {
  console.log('=== API Route /api/gallery/upload: POST request received ===');
  
  // Apply rate limiting based on IP address or forwarded header
  const forwarded = request.headers.get('x-forwarded-for') || 'unknown';
  const clientId = forwarded.split(',')[0].trim();
  
  if (!checkRateLimit(clientId)) {
    console.warn(`API Route: Rate limit exceeded for client ${clientId}`);
    return NextResponse.json({
      error: 'Too many upload requests',
      message: 'Please wait before trying again.'
    }, { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }
  
  try {
    // Use our createClient helper from lib/supabase/server.ts
    const supabase = await createClient('UploadRoute');

    // Get the user from the session
    console.log('API Route: Attempting to get user from session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('API Route: Error getting session:', sessionError.message);
      return NextResponse.json({ 
        error: 'Authentication failed',
        message: 'Session error. Please sign in again.',
      }, { status: 401 });
    }
    
    if (!session) {
      console.error('API Route: No session found');
  
      // Check for Authorization header as fallback
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('API Route: Trying Authorization header as fallback');
    const token = authHeader.substring(7);
    
    try {
          // Create a temporary client to validate the token
          const tempClient = createSupabaseClient(
        API_CONFIG.supabaseUrl!,
        API_CONFIG.supabaseAnonKey!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      // Attempt to get user with token
      const { data: userData, error: userError } = await tempClient.auth.getUser();
      
      if (!userError && userData.user) {
        console.log(`API Route: Successfully authenticated with token. User ID: ${userData.user.id}`);
            
            // Use this user for the storage operations
            try {
              return await handleFileUpload(request, tempClient, userData.user);
            } catch (error) {
              console.error('API Route: Error during token-auth file upload:', error);
              const message = error instanceof Error ? error.message : 'An unknown error occurred.';
              return NextResponse.json({ error: 'Upload failed', details: message }, { status: 500 });
            }
      } else {
        console.log('API Route: Token authentication failed:', userError?.message);
            return NextResponse.json({ 
              error: 'Authentication failed',
              message: 'Invalid or expired token. Please sign in again.',
            }, { status: 401 });
      }
    } catch (err) {
      console.error('API Route: Error validating Authorization header token:', err);
    }
      }
      
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please sign in to upload files.',
      }, { status: 401 });
    }
    
    // If we have a valid session, proceed with the upload
    try {
      return await handleFileUpload(request, supabase, session.user);
           } catch (error) {
      console.error('API Route: Unexpected error during file upload:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
  } catch (error) {
    console.error('API Route: Error initializing Supabase client:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
  }
  
// Separated file upload logic function to avoid duplication
async function handleFileUpload(request: NextRequest, client: any, user: any) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pathPrefix = formData.get('pathPrefix') as string | null; // Get the path prefix

    if (!file) {
      console.error('API Route: No file found in request.');
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    
    console.log(`API Route: Received file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    console.log(`API Route: Received pathPrefix: "${pathPrefix ?? ''}"`); // Log the received prefix

    // Validate file type and size server-side as well
    if (!file.type.startsWith('image/')) {
      console.error('API Route: Invalid file type uploaded.');
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }
    // Example size limit (e.g., 10MB)
    if (file.size > 10 * 1024 * 1024) { 
        console.error('API Route: File size exceeds limit.');
        return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 413 });
    }

    // Sanitize the received path prefix
    const sanitizedPrefix = sanitizePathPrefix(pathPrefix || '');
    console.log(`API Route: Sanitized pathPrefix: "${sanitizedPrefix}"`);

    // Construct the final storage path including the sanitized prefix
    // Ensure prefix ends with / if not empty
    const finalPrefix = sanitizedPrefix; // Already ends with / or is empty
  const filePath = `${user.id}/${finalPrefix}${file.name}`;
    console.log(`API Route: Uploading to bucket '${BUCKET_NAME}' at final path: ${filePath}`);

  // Upload the file using the provided client
  const { data: uploadData, error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Set to true if you want to overwrite files with the same name
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
        statusCode = 403;
        errorMessage = 'Not authorized to upload. Check RLS policies.';
      } else if (uploadError.message.includes('mime type')) {
        statusCode = 400;
        errorMessage = 'Invalid file type';
      } else if (uploadError.message.includes('exceeds size limit')) {
        statusCode = 413;
        errorMessage = 'File size exceeds limit';
      } else if (uploadError.message.includes('Row violation') || uploadError.message.includes('RLS policy')) {
        statusCode = 403;
        errorMessage = 'Upload blocked by security policy. Check RLS.';
      } else if (uploadError.message.includes('duplicate') || uploadError.message.includes('already exists')) {
          statusCode = 409; // Conflict
          errorMessage = `File '${file.name}' already exists at this location.`;
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: uploadError.message,
      user_id: user.id // Add user ID to help debugging
      }, { status: statusCode });
    }

    console.log('API Route: File uploaded successfully:', uploadData);

    // Return success response
    return NextResponse.json({
      message: 'File uploaded successfully',
      path: uploadData?.path, // Return the final path used by Supabase
    }, { status: 200 });
} 