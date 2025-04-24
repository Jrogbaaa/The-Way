import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG } from '@/lib/config';
// Add imports for standard Supabase client and User type
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

const BUCKET_NAME = 'gallery-uploads';
const PLACEHOLDER_FILE_NAME = '.keep'; // Standard practice for empty folders

// Helper function to sanitize folder/path names
// Removes leading/trailing slashes, prevents '..' segments, removes invalid chars
const sanitizeName = (name: string, isPathPrefix: boolean = false): string => {
  if (!name) return '';

  // Disallow '..' completely for simplicity and security
  if (name.includes('..')) {
    console.warn(`Attempted directory traversal detected in name/prefix: ${name}`);
    return '';
  }

  // Remove leading/trailing slashes
  let sanitized = name.replace(/^[/\\]+|[\\/]+$/g, ''); // Handle both slash types just in case

  // Remove potentially problematic characters 
  // Keep: letters (Unicode), numbers, whitespace, hyphen, underscore, dot
  // Optionally keep: forward slash (for path prefixes)
  const invalidCharsRegex = isPathPrefix
    ? /[^\p{L}\p{N}\s\-_\/\.]/gu // Allow letters, numbers, whitespace, -, _, /, .
    : /[^\p{L}\p{N}\s\-_\.]/gu;  // Allow letters, numbers, whitespace, -, _, .

  sanitized = sanitized.replace(invalidCharsRegex, '');

  // Collapse multiple slashes for path prefix
  if (isPathPrefix) {
      sanitized = sanitized.replace(/[/\\]+/g, '/'); // Collapse multiple slashes (either type)
  }
  
  // Trim extra whitespace that might have been left or introduced
  sanitized = sanitized.trim();

  return sanitized;
};

export async function POST(request: NextRequest) {
  console.log('=== API Route /api/gallery/create-folder: POST request received ===');

  // --- Authentication Start ---
  let user: User | null = null;
  let supabase: SupabaseClient | ReturnType<typeof createServerClient>;
  const authHeader = request.headers.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('API Route/create-folder: Found Authorization header, attempting token auth');
    const token = authHeader.substring(7);
    try {
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        }
      );
      const { data: userData, error: verifyError } = await supabase.auth.getUser();
      if (verifyError || !userData.user) {
        console.error('API Route/create-folder: Token verification failed:', verifyError?.message);
        return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid or expired token.' }, { status: 401 });
      }
      user = userData.user;
      // Add explicit check for TS
      if (user) {
      console.log(`API Route/create-folder: Authenticated via token for user ${user.id}`);
      } else {
        // This case should logically not be reached due to the check above, but satisfies TS
        console.error('API Route/create-folder: Token verification succeeded but user object is unexpectedly null.');
        return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Authentication process failed internally.' }, { status: 500 });
      }
    } catch (tokenError) {
      console.error('API Route/create-folder: Error processing token:', tokenError);
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Failed to process authentication token.' }, { status: 401 });
    }
  } else {
    console.log('API Route/create-folder: No Authorization header, falling back to cookie auth');
    const cookieStore = await cookies();
    try {
      supabase = createServerClient(
    API_CONFIG.supabaseUrl!,
        API_CONFIG.supabaseAnonKey!,
    {
      cookies: {
            get(name: string) { return cookieStore.get(name)?.value; },
            set(name: string, value: string, options: CookieOptions) { },
            remove(name: string, options: CookieOptions) { },
      },
    }
  );
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !userData.user) {
        console.error('API Route/create-folder: Cookie auth failed:', getUserError?.message);
        return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No valid session found via cookies.' }, { status: 401 });
  }
      user = userData.user;
      // Add explicit check for TS
      if (user) {
      console.log(`API Route/create-folder: Authenticated via cookies for user ${user.id}`);
      } else {
        // This case should logically not be reached due to the check above, but satisfies TS
        console.error('API Route/create-folder: Cookie auth succeeded but user object is unexpectedly null.');
        return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Authentication process failed internally.' }, { status: 500 });
      }
    } catch (cookieError) {
      console.error('API Route/create-folder: Error during cookie-based authentication setup:', cookieError);
      return NextResponse.json({ success: false, error: 'Authentication setup failed', message: cookieError instanceof Error ? cookieError.message : 'Unknown error.' }, { status: 500 });
    }
  }

  if (!user || !supabase) {
    console.error('API Route/create-folder: Failed to establish authenticated Supabase client.');
    return NextResponse.json({ success: false, error: 'Internal Server Error', message: 'Could not initialize authentication context.' }, { status: 500 });
  }
  // Use userId which is guaranteed non-null after the check
  const userId = user.id; 
  console.log(`API Route/create-folder: Proceeding with user ID: ${userId}`);
  // --- Authentication End ---

  // --- Request Body Parsing --- 
  let reqData;
  try {
    reqData = await request.json();
  } catch (e) {
    console.error('API Route: Invalid JSON body', e);
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawFolderName = reqData?.folderName;
  const rawParentPathPrefix = reqData?.parentPathPrefix || ''; // Default to root

  // --- Input Validation & Sanitization --- 
  if (!rawFolderName || typeof rawFolderName !== 'string') {
    return NextResponse.json({ success: false, error: 'Missing or invalid folderName' }, { status: 400 });
  }
  if (typeof rawParentPathPrefix !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid parentPathPrefix' }, { status: 400 });
  }

  const folderName = sanitizeName(rawFolderName, false); // Sanitize folder name
  let parentPathPrefix = sanitizeName(rawParentPathPrefix, true); // Sanitize parent path

  if (!folderName) {
      return NextResponse.json({ success: false, error: 'Invalid folder name after sanitization (contains forbidden characters or is empty)' }, { status: 400 });
  }
  // Check if original prefix was provided but sanitized away (meaning it was invalid)
  if (rawParentPathPrefix && !parentPathPrefix && rawParentPathPrefix !== '/') {
      return NextResponse.json({ success: false, error: 'Invalid parent path prefix after sanitization (contains forbidden characters)' }, { status: 400 });
  }
  
  // Ensure parentPathPrefix ends with slash if not empty
  if (parentPathPrefix && !parentPathPrefix.endsWith('/')) {
      parentPathPrefix += '/';
  }

  // --- Construct Path --- 
  const parentPrefixWithSlash = parentPathPrefix; 
  // Use userId here
  const placeholderFilePath = `${userId}/${parentPrefixWithSlash}${folderName}/${PLACEHOLDER_FILE_NAME}`; 
  // Return path without user ID
  const logicalFolderPath = `${parentPrefixWithSlash}${folderName}`;
  
  console.log(`API Route: Attempting to create folder at storage path: ${placeholderFilePath}`);
  console.log(`API Route: Corresponding logical folder path: ${logicalFolderPath}`);

  // --- Create Folder (Upload Placeholder) --- 
  try {
    // Check if folder (placeholder) already exists
    const { data: existingFileData, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        // Use userId here
        .list(`${userId}/${parentPrefixWithSlash}${folderName}`, { limit: 1, search: PLACEHOLDER_FILE_NAME });

    // Return error immediately if list operation fails
    if (listError) {
        console.error("API Route: Error checking for existing folder placeholder:", listError);
        return NextResponse.json({ success: false, error: 'Failed to check if folder exists', details: listError.message }, { status: 500 });
    }

    if (existingFileData && existingFileData.length > 0) {
         console.log("API Route: Folder placeholder already exists.");
         return NextResponse.json({ success: false, error: `Folder '${folderName}' already exists at this location.` }, { status: 409 }); 
    }

    // Proceed to upload the placeholder
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(placeholderFilePath, new Blob(['']), { // Upload empty blob
        contentType: 'text/plain', // Or application/octet-stream
        cacheControl: '3600',
        upsert: false // Definitely false now, we checked existence
      });

    if (uploadError) {
      console.error('API Route: Failed to upload placeholder file:', uploadError);
      if (uploadError.message.includes('Row violation') || uploadError.message.includes('RLS policy')) {
          return NextResponse.json({ success: false, error: 'Folder creation blocked by security policy. Check RLS.' }, { status: 403 });
      }
      return NextResponse.json({ success: false, error: `Failed to create folder: ${uploadError.message}` }, { status: 500 });
    }

    console.log('API Route: Folder placeholder created successfully:', uploadData);
    return NextResponse.json({ 
        success: true, 
        message: 'Folder created successfully',
        folderName: folderName,
        parentPath: parentPathPrefix.replace(/\/$/, ''),
        fullPath: logicalFolderPath // Return path relative to user's root
     }, { status: 201 }); 

  } catch (error) {
    console.error('API Route: Unexpected error during folder creation:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, error: 'Internal server error', details: message }, { status: 500 });
  }
} 