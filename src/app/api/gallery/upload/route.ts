import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

// Ensure this bucket name matches the one in your Supabase project
const BUCKET_NAME = 'gallery-uploads'; 

export async function POST(request: Request) {
  console.log('=== API Route /api/gallery/upload: POST request received ===');
  
  // Debug: Log request headers with more details
  const headerEntries = Array.from(request.headers.entries());
  console.log('API Route: Request headers:', JSON.stringify(headerEntries, null, 2));
  
  // Log method and URL for completeness
  console.log(`API Route: ${request.method} ${request.url}`);
  
  // Check for ContentType and ContentLength
  console.log(`API Route: Content-Type: ${request.headers.get('Content-Type')}`);
  console.log(`API Route: Content-Length: ${request.headers.get('Content-Length')}`);
  
  // FIRST: Check for Authorization header as it may be more reliable
  const authHeader = request.headers.get('Authorization');
  let tokenAuth = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('API Route: Found Authorization header, will try this first');
    const token = authHeader.substring(7);
    
    // Create a client with the token and try to get the user
    // This bypasses cookie issues altogether
    try {
      const tempClient = createClient(
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
        tokenAuth = {
          user: userData.user,
          client: tempClient
        };
      } else {
        console.log('API Route: Token authentication failed:', userError?.message);
      }
    } catch (err) {
      console.error('API Route: Error using Authorization header:', err);
    }
  } else {
    console.log('API Route: No Authorization header found, will try cookie auth');
  }
  
  // If token auth failed or wasn't available, try cookie auth as usual
  if (!tokenAuth) {
    // Await the cookies() call to resolve the Promise
    const cookieStore = await cookies();
    
    // Debug: Log all available cookies with more details
    const allCookies = cookieStore.getAll();
    console.log('API Route: Available cookies count:', allCookies.length);
    
    // More verbose cookie logging
    if (allCookies.length > 0) {
      console.log('API Route: Cookie names found:', allCookies.map(c => c.name).join(', '));
      console.log('API Route: Cookie details:', JSON.stringify(allCookies.map(c => ({
        name: c.name,
        value: c.value ? `${c.value.substring(0, 8)}...` : 'empty'
      })), null, 2));
    } else {
      console.log('API Route: ⚠️ NO COOKIES FOUND! This may indicate a problem with cookie forwarding.');
    }
    
    // Debug: specifically check for various Supabase auth cookies
    const supabaseAccessToken = cookieStore.get('sb-access-token');
    const supabaseRefreshToken = cookieStore.get('sb-refresh-token');
    const supabaseAuthToken = cookieStore.get('sb-auth-token');
    const sbAuth = cookieStore.get('sb-auth');
    
    console.log('API Route: Supabase cookies check:', {
      'sb-access-token': supabaseAccessToken ? `present (${supabaseAccessToken.value.substring(0, 8)}...)` : 'missing',
      'sb-refresh-token': supabaseRefreshToken ? `present (${supabaseRefreshToken.value.substring(0, 8)}...)` : 'missing',
      'sb-auth-token': supabaseAuthToken ? `present (${supabaseAuthToken.value.substring(0, 8)}...)` : 'missing',
      'sb-auth': sbAuth ? `present (${sbAuth.value.substring(0, 8)}...)` : 'missing'
    });
  }

  // Set up the user and client based on which auth method worked
  let user = null;
  let supabase = null;
  
  if (tokenAuth) {
    // Use the already authenticated client and user from token
    user = tokenAuth.user;
    supabase = tokenAuth.client;
    console.log('API Route: Using token-authenticated client');
  } else {
    // Create Supabase client using the standard pattern for Route Handlers with cookies
    console.log('API Route: Creating Supabase client with cookie store...');
    const cookieStore = await cookies();
    
    supabase = createServerClient(
      API_CONFIG.supabaseUrl!,
      API_CONFIG.supabaseAnonKey!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`API Route: Cookie get('${name}') → ${cookie ? `Found: ${cookie.value.substring(0, 5)}...` : 'NOT FOUND'}`);
            return cookie?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
               cookieStore.set({ name, value, ...options });
               console.log(`API Route: Set cookie '${name}' (${value.substring(0, 5)}...)`);
            } catch (error) {
               console.warn(`Failed to set cookie '${name}' from Route Handler: ${error}`);
            }
          },
          remove(name: string, options: CookieOptions) {
             try {
               cookieStore.set({ name, value: '', ...options });
               console.log(`API Route: Removed cookie '${name}'`);
             } catch (error) {
               console.warn(`Failed to remove cookie '${name}' from Route Handler: ${error}`);
             }
          },
        },
      }
    );
    
    // Try to get session from cookies
    console.log('API Route: Attempting to get user session from cookies...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('API Route: Error getting session:', sessionError.message);
      console.error('API Route: Session error details:', JSON.stringify(sessionError));
    } else if (session) {
      console.log('API Route: Successfully retrieved session. User ID:', session.user.id);
      console.log('API Route: Session expires at:', new Date(session.expires_at! * 1000).toISOString());
      console.log('API Route: Current time:', new Date().toISOString());
      user = session.user;
    } else {
      console.log('API Route: No session found from cookie store.');
    }
  }

  // At this point we should have a user from either cookies or token
  if (!user) {
    console.error('API Route: ❌ CRITICAL ERROR - No user could be retrieved via any method');
    return NextResponse.json({ 
      error: 'Authentication failed completely',
      message: 'Please sign in again and ensure you have cookies enabled.',
      hint: 'Try refreshing the page before uploading.' 
    }, { status: 401 });
  }
  
  console.log('API Route: User authenticated:', user.id);

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

    // We don't need to check if the bucket exists or try to create it
    // We know the bucket exists (as shown in the screenshot)
    // Let's directly try to upload to it
    console.log(`API Route: Using existing bucket '${BUCKET_NAME}'`);

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
        statusCode = 403;
        errorMessage = 'Not authorized to upload to this bucket. Check RLS policies.';
      } else if (uploadError.message.includes('mime type')) {
        statusCode = 400;
        errorMessage = 'Invalid file type';
      } else if (uploadError.message.includes('exceeds size limit')) {
        statusCode = 413;
        errorMessage = 'File size exceeds limit';
      } else if (uploadError.message.includes('row-level security policy')) {
        statusCode = 403;
        errorMessage = 'You do not have permission to upload to this bucket. The Supabase RLS policy is blocking this upload.';
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: uploadError.message,
        stack: uploadError.stack,
        user_id: user.id // Add user ID to help debugging
      }, { status: statusCode });
    }

    console.log('API Route: File uploaded successfully:', uploadData);

    // Get the public URL (assumes bucket is public or you have policies allowing reads)
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
    const publicUrl = urlData?.publicUrl;
    console.log('API Route: Public URL retrieved:', publicUrl);

    return NextResponse.json({ 
        success: true, 
        message: 'File uploaded successfully',
        file: {
            name: file.name,
            size: file.size,
            type: file.type,
            path: filePath,
            url: publicUrl
        }
    });
  } catch (error) {
    console.error('API Route: Unexpected error during upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
        error: 'Upload failed', 
        message: errorMessage,
        user_id: user?.id
    }, { status: 500 });
  }
} 