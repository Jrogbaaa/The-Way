import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

// Track recent requests to implement basic rate limiting
const recentRequests = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 50; // Higher limit for gallery fetch as it's frequently accessed

export const GET = async (request: NextRequest) => {
  console.log('GalleryAPI/fetch: Request received');
  
  try {
    // Basic rate limiting using IP or another identifier
    const clientId = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'; // Use a more robust client identifier
    const now = Date.now();
    
    // Get or create request tracking data
    let requestData = recentRequests.get(clientId);
    if (!requestData) {
      requestData = { count: 0, lastRequest: now };
      recentRequests.set(clientId, requestData);
    }
    
    // Reset counter if outside window
    if (now - requestData.lastRequest > RATE_LIMIT_WINDOW) {
      requestData.count = 0;
      requestData.lastRequest = now;
    }
    
    // Increment and check
    requestData.count += 1;
    
    if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
      console.warn(`GalleryAPI/fetch: Rate limit exceeded for ${clientId}`);
      return NextResponse.json({
        error: 'Too many requests',
        message: 'Please try again later'
      }, { 
        status: 429, 
        headers: { 'Retry-After': '60' }
      });
    }
    
    // --- Authentication Logic Start ---
    let user: User | null = null;
    let supabase; // Will hold the authenticated client instance

    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('GalleryAPI/fetch: Found Authorization header, attempting token auth');
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        // Use createSupabaseClient (standard JS client) for token auth
        supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { autoRefreshToken: false, persistSession: false },
          }
        );

        // Verify token validity by fetching the user
        const { data: userData, error: verifyError } = await supabase.auth.getUser();

        if (verifyError || !userData.user) {
          console.error('GalleryAPI/fetch: Token verification failed:', verifyError?.message);
          return NextResponse.json({
            error: 'Unauthorized',
            message: 'Invalid or expired token. Please sign in again.'
          }, { status: 401 });
        }

        user = userData.user;
        console.log(`GalleryAPI/fetch: Authenticated via token for user ${user.id}`);

      } catch (tokenError) {
        console.error('GalleryAPI/fetch: Error processing token:', tokenError);
        return NextResponse.json({
          error: 'Unauthorized',
          message: 'Failed to process authentication token.'
        }, { status: 401 });
      }

    } else {
      // Fall back to cookie-based auth
      console.log('GalleryAPI/fetch: No Authorization header, falling back to cookie auth');
      try {
        // Use the server helper client for cookie auth
        supabase = await createClient('GalleryFetchAPI_Cookie');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('GalleryAPI/fetch: Cookie auth - Error getting session:', sessionError.message);
          return NextResponse.json({ error: 'Authentication failed', message: sessionError.message }, { status: 401 });
        }

        if (!session || !session.user) {
          console.error('GalleryAPI/fetch: Cookie auth - No valid session found');
          return NextResponse.json({ error: 'Unauthorized', message: 'No authenticated user found via cookies.' }, { status: 401 });
        }

        user = session.user;
        console.log(`GalleryAPI/fetch: Authenticated via cookies for user ${user.id}`);

      } catch (cookieError) {
        console.error('GalleryAPI/fetch: Error during cookie-based authentication setup:', cookieError);
        return NextResponse.json({ error: 'Authentication setup failed', message: cookieError instanceof Error ? cookieError.message : 'Unknown error.' }, { status: 500 });
      }
    }

    // --- Authentication Logic End ---

    if (!user || !supabase) {
      // Safeguard check
      console.error('GalleryAPI/fetch: Failed to establish authenticated Supabase client.');
      return NextResponse.json({ error: 'Internal Server Error', message: 'Could not initialize authentication context.' }, { status: 500 });
    }

    console.log(`GalleryAPI/fetch: Proceeding with user ${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get('path');
    
    if (!imagePath) {
      return NextResponse.json(
        { error: 'Missing parameter', message: 'Image path is required' },
        { status: 400 }
      );
    }
    
    // Check if the path belongs to the authenticated user
    const pathSegments = imagePath.split('/');
    if (pathSegments.length < 2 || pathSegments[0] !== user.id) {
      console.error(`GalleryAPI/fetch: User ${user.id} tried to access unauthorized path ${imagePath}`);
      return NextResponse.json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      }, { status: 403 });
    }
    
    console.log(`GalleryAPI/fetch: Generating signed URL for user ${user.id}, path: ${imagePath}`);
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('gallery-uploads')
      .createSignedUrl(imagePath, 300); // 5 minute expiry
    
    if (signedUrlError) {
      console.error(`GalleryAPI/fetch: Error generating signed URL for ${imagePath}:`, signedUrlError);
      return NextResponse.json({
        error: 'File access error',
        message: signedUrlError.message
      }, { status: 500 });
    }
    
    console.log(`GalleryAPI/fetch: Successfully generated signed URL for ${imagePath}`);
    return NextResponse.json({ success: true, url: signedUrlData.signedUrl });
    
  } catch (error) {
    console.error('GalleryAPI/fetch: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}; 