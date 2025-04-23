import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { StorageError } from '@supabase/storage-js';
// Re-add createSupabaseClient for token-based auth
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; 

// Track recent requests to implement basic rate limiting
const recentRequests = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 30; // Higher limit for gallery list as it's frequently accessed

// Define the type for items returned by Supabase storage list with a delimiter
type StorageListItem = {
  name: string;
  id: string | null; // null for folders (prefixes)
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>; // Using Record<string, any> for simplicity
};

export const GET = async (request: NextRequest) => {
  console.log('GalleryAPI/list: Request received');
  
  try {
    // Basic rate limiting using the best available client identifier
    const clientId = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
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
      console.warn(`GalleryAPI/list: Rate limit exceeded for ${clientId}`);
      return NextResponse.json({
        error: 'Too many requests',
        message: 'Please try again later'
      }, { 
        status: 429, 
        headers: { 'Retry-After': '60' }
      });
    }
    
    // --- Authentication: Prioritize Token, Fallback to Cookie --- 
    let user = null;
    let supabase; 
    
    // Check for Authorization header first
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('GalleryAPI/list: Found Authorization header, attempting token auth');
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create a direct client with the token
      try {
        // Use createSupabaseClient (the standard JS client) for token auth
        supabase = createSupabaseClient( 
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            auth: { // Important: disable auto-refresh and persistence for server-side token use
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        
        // Verify token validity by fetching the user
        const { data: userData, error: verifyError } = await supabase.auth.getUser();

        if (verifyError || !userData.user) {
          console.error('GalleryAPI/list: Token verification failed:', verifyError?.message);
          // Return 401 if token is invalid
          return NextResponse.json({ 
            error: 'Unauthorized', 
            message: 'Invalid or expired token. Please sign in again.'
          }, { status: 401 });
        }
        
        user = userData.user;
        console.log(`GalleryAPI/list: Authenticated via token for user ${user.id}`);

      } catch (tokenError) {
        console.error('GalleryAPI/list: Error processing token:', tokenError);
        return NextResponse.json({ 
          error: 'Unauthorized', 
          message: 'Failed to process authentication token.'
        }, { status: 401 });
      }

    } else {
      // Fall back to cookie-based auth if no token header is present
      console.log('GalleryAPI/list: No Authorization header, falling back to cookie auth');
      try {
        // Use the server helper client for cookie auth
        supabase = await createClient('GalleryListAPI_Cookie'); 
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('GalleryAPI/list: Cookie auth - Error getting session:', sessionError.message);
          return NextResponse.json({
            error: 'Authentication failed',
            message: sessionError.message
          }, { status: 401 });
        }
        
        if (!session || !session.user) {
          console.error('GalleryAPI/list: Cookie auth - No valid session found');
          return NextResponse.json({ 
            error: 'Unauthorized', 
            message: 'No authenticated user found via cookies. Please sign in again.'
          }, { status: 401 });
  }
        
        user = session.user;
        console.log(`GalleryAPI/list: Authenticated via cookies for user ${user.id}`);

      } catch (cookieError) {
        console.error('GalleryAPI/list: Error during cookie-based authentication setup:', cookieError);
        return NextResponse.json({ 
          error: 'Authentication setup failed', 
          message: cookieError instanceof Error ? cookieError.message : 'Unknown authentication error.'
        }, { status: 500 });
      }
    }
    // --- End Authentication Logic ---
    
    // At this point, we should have a valid user and supabase client instance
    // if authentication succeeded either way.
    if (!user || !supabase) { 
      // This should theoretically not be reached if the logic above is correct, but acts as a safeguard.
      console.error('GalleryAPI/list: Failed to establish authenticated Supabase client.');
      return NextResponse.json({ 
        error: 'Internal Server Error', 
        message: 'Could not initialize authentication context.'
      }, { status: 500 });
    }
    
    console.log(`GalleryAPI/list: Proceeding with user ${user.id}`);

  const searchParams = request.nextUrl.searchParams;
  const recursive = searchParams.get('recursive') === 'true';

  // Get pathPrefix, decode it (as it might contain spaces or special chars), and remove leading/trailing slashes
  const rawPathPrefix = searchParams.get('pathPrefix') || '';
  const decodedPathPrefix = decodeURIComponent(rawPathPrefix).replace(/^\/+|\/+$/g, '');

  // Construct the prefix for Supabase: user_id/decoded_path/
  // Ensure it ends with a slash if it's not the root
  const supabasePrefix = decodedPathPrefix ? `${decodedPathPrefix}/` : '';
  const fullPrefix = `${user.id}/${supabasePrefix}`;

    console.log(`GalleryAPI/list: Listing items for prefix: ${fullPrefix}` + (recursive ? ' (Recursive)' : ''));

    if (recursive) {
        // --- Recursive Folder Listing Logic --- 
        let allObjects: StorageListItem[] = [];
        let marker: string | undefined = undefined;
        const userRootPrefix = `${user.id}/`;

        console.log(`GalleryAPI/list: Starting recursive fetch for user root: ${userRootPrefix}`);

        try {
            // Loop to handle potential pagination if there are many objects
            // Note: Supabase list has a default limit (often 100), adjust if needed
            // For simplicity here, assuming limit is high enough or pagination isn't critical for *just* folder paths.
            // In production, proper pagination might be required.
            const { data: storageObjects, error: listError } = await supabase.storage
                .from('gallery-uploads')
                .list(userRootPrefix, { 
                    limit: 1000, // Fetch a larger batch for potentially fewer calls
                    // NO delimiter for recursive!
                });

            if (listError) {
                 throw listError; // Throw to be caught by the outer try/catch
            }
            
            if (storageObjects) {
                allObjects = storageObjects as StorageListItem[];
            } else {
                allObjects = [];
            }

            console.log(`GalleryAPI/list: Fetched ${allObjects.length} total objects recursively.`);

            const folderPaths = new Set<string>();
            for (const obj of allObjects) {
                if (obj.id !== null) { // It's a file
                    const filePath = obj.name; // Path relative to userRootPrefix
                    const lastSlashIndex = filePath.lastIndexOf('/');
                    if (lastSlashIndex > 0) { // Check > 0 to avoid root files
                        const folderPath = filePath.substring(0, lastSlashIndex);
                        if (folderPath) { // Ensure it's not an empty string
                            folderPaths.add(folderPath);
                        }
                    }
                }
                // We could also check for obj.id === null and obj.name ending with '.keep'
                // if folders are explicitly created with a .keep file, but path extraction is more general.
            }

            const folders = Array.from(folderPaths).map(fullPath => {
                const parts = fullPath.split('/');
                const name = parts[parts.length - 1];
                return { name: name, path: fullPath + '/', type: 'folder' }; // Add trailing slash for consistency
            }).sort((a, b) => a.path.localeCompare(b.path)); // Sort alphabetically by path

            console.log(`GalleryAPI/list: Found ${folders.length} unique folders recursively.`);

            return NextResponse.json({ 
                success: true,
                items: folders, // Only return folders for recursive requests
                currentPrefix: '' // Prefix isn't relevant in recursive mode
            });

        } catch (listError: any) {
            // Handle errors similarly to non-recursive path
            console.error(`GalleryAPI/list: Error during recursive listing for user ${user.id}:`, listError);
            if (listError instanceof StorageError) {
                if (listError.message.includes('Bucket not found')) {
                  return NextResponse.json({ error: 'Storage not initialized', message: 'Storage bucket not found' }, { status: 404 });
                } else if (listError.message.includes('not authorized')) {
                  console.error('GalleryAPI/list: User not authorized for recursive list. Check RLS.');
                  return NextResponse.json({ error: 'Access denied', message: 'Storage permissions denied.' }, { status: 403 });
                }
                return NextResponse.json({ error: 'Failed to list storage contents', message: listError.message }, { status: 500 });
            } else {
                 return NextResponse.json({ error: 'Internal Server Error', message: 'Failed during recursive folder listing.' }, { status: 500 });
            }
        }
        // --- End Recursive Logic --- 

    } else {
        // --- Non-Recursive (Original) Logic --- 
        const { data: listData, error: listError } = await supabase.storage
            .from('gallery-uploads')
            .list(fullPrefix, {
                limit: 500, 
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
                // @ts-ignore - Keep delimiter for non-recursive
                delimiter: '/', 
            });

        if (listError) {
            console.error(`GalleryAPI/list: Error listing Supabase storage for prefix ${fullPrefix}:`, listError);
            
            if (listError instanceof StorageError) {
                if (listError.message.includes('Bucket not found')) {
                    return NextResponse.json({ error: 'Storage not initialized', message: 'Storage bucket not found' }, { status: 404 });
                } else if (listError.message.includes('not authorized')) {
                    console.error('GalleryAPI/list: User not authorized. Check RLS policies.');
                    return NextResponse.json({ error: 'Access denied', message: 'Storage permissions denied.' }, { status: 403 });
                }
            }
            return NextResponse.json({ error: 'Failed to list storage contents', message: listError.message }, { status: 500 });
        }

        const typedListData = listData as StorageListItem[] | null;

        const folders = typedListData
            ?.filter((item: StorageListItem) => item.id === null)
            .map((item: StorageListItem) => ({ 
                name: item.name.replace(/\/$/, ''), // Remove trailing slash from folder name if present
                path: `${supabasePrefix}${item.name}`, // Construct full path
                type: 'folder' 
            })) || [];

        const files = typedListData
            ?.filter((item: StorageListItem) => item.id !== null && item.name !== '.keep')
            .map((item: StorageListItem) => ({
                name: item.name,
                id: item.id!,
                updated_at: item.updated_at,
                created_at: item.created_at,
                last_accessed_at: item.last_accessed_at,
                metadata: item.metadata,
                type: 'file',
                path: `${fullPrefix}${item.name}`,
            })) || [];

        const items = [...folders, ...files];

        return NextResponse.json({ 
            success: true,
            items, 
            currentPrefix: supabasePrefix.replace(/\/$/, '') // Return prefix without trailing slash
        });
        // --- End Non-Recursive Logic ---
    }

  } catch (error) {
    console.error('GalleryAPI/list: Unexpected top-level error:', error);
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