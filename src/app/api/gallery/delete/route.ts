import { type NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseBrowserClient, SupabaseClient } from '@supabase/supabase-js'
import { BUCKET_NAME } from '@/lib/constants'

// Define a type for the items returned by Supabase storage list
interface FileObject {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, any> | null;
}

// Helper to check for Supabase Storage errors
function isStorageError(error: any): error is { message: string } {
  return error && typeof error.message === 'string';
}

// Helper to determine if the path is a folder (ends with /)
// Note: This helper is not currently used but kept for potential future use.
// function isFolder(path: string): boolean {
//   return path.endsWith('/');
// }

export async function POST(request: NextRequest) {
  let supabase: SupabaseClient;
  let userId: string | undefined;

  console.log('Delete API: Received request');

  let itemPath: string;
  let itemType: 'file' | 'folder';

  try {
    const body = await request.json();
    itemPath = body.path;
    itemType = body.itemType;
  } catch (error) {
    console.error('Delete API: Failed to parse request body:', error);
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }


  if (!itemPath || !itemType || (itemType !== 'file' && itemType !== 'folder')) {
    console.error('Delete API: Missing or invalid path or itemType', { itemPath, itemType });
    return NextResponse.json({ success: false, error: 'Missing or invalid path or itemType' }, { status: 400 });
    }

  let cleanedPath: string;
  try {
    // Basic inline path sanitization - prevent directory traversal
    // NOTE: This is basic and might need a more robust solution.
    cleanedPath = itemPath.replace(/\.\.\//g, '').replace(/\.\.\\/g, ''); // Remove ../ and ..\\
    // Normalize slashes to forward slashes
    cleanedPath = cleanedPath.replace(/\\/g, '/'); 
    // Remove leading/trailing slashes for consistency before prepending user ID
    cleanedPath = cleanedPath.replace(/^\/+|\/+$/g, ''); 

    if (!cleanedPath) {
        throw new Error("Path became empty after sanitization.");
    }

    // Ensure folder paths consistently end with a slash AFTER cleaning
    if (itemType === 'folder') {
      cleanedPath += '/';
    }

    console.log(`Delete API: Sanitized path: \"${cleanedPath}\"`);
  } catch (error) {
    console.error('Delete API: Path sanitization failed:', error);
    const message = error instanceof Error ? error.message : 'Invalid path provided';
    return NextResponse.json({ success: false, error: 'Invalid path', details: message }, { status: 400 });
    }

  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Delete API: Found Authorization header, attempting token auth');
      supabase = createSupabaseBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Delete API: Invalid token or user not found', userError);
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
      userId = user.id;
      console.log(`Delete API: Authenticated via token for user: ${userId}`);
    } else {
      console.log('Delete API: No Authorization header, attempting cookie auth');
      supabase = await createSupabaseServerClient('DeleteAPI');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.error('Delete API: Could not get session or user', sessionError);
        return NextResponse.json({ success: false, error: 'Unauthorized: No active session' }, { status: 401 });
    }
      userId = session.user.id;
      console.log(`Delete API: Authenticated via cookie for user: ${userId}`);
    }

    if (!userId) {
      console.error('Delete API: Could not determine user ID after auth checks');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userSpecificPath = `${userId}/${cleanedPath}`;
    console.log(`Delete API: User-specific path for operation: \"${userSpecificPath}\"`);

    if (itemType === 'file') {
      console.log(`Delete API: Attempting to delete file: \"${userSpecificPath}\"`);
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([userSpecificPath]);

      if (deleteError) {
        console.error(`Delete API: Error deleting file \"${userSpecificPath}\":`, deleteError);
        if (isStorageError(deleteError) && (deleteError.message.includes('Not Found') || deleteError.message.includes('OBJECT_NOT_FOUND'))) {
          console.log(`Delete API: File \"${userSpecificPath}\" not found, considered deletion successful.`);
          return NextResponse.json({ success: true, message: 'File not found, presumed deleted.' }, { status: 200 });
        }
        return NextResponse.json({ success: false, error: 'Failed to delete file.', details: deleteError.message }, { status: 500 });
      }

      console.log(`Delete API: Successfully deleted file: \"${userSpecificPath}\"`);
      return NextResponse.json({ success: true, message: 'File deleted successfully.' }, { status: 200 });

    } else {
      const folderPrefix = userSpecificPath;
      console.log(`Delete API: Attempting to delete folder contents for prefix: \"${folderPrefix}\"`);

        const { data: listData, error: listError } = await supabase.storage
            .from(BUCKET_NAME)
        .list(folderPrefix, { limit: 1000 });

        if (listError) {
        console.error(`Delete API: Error listing folder contents for path \"${folderPrefix}\":`, listError);
         if (isStorageError(listError) && (listError.message.includes('Not Found') || listError.message.includes('BUCKET_NOT_FOUND'))) {
            console.log(`Delete API: Folder prefix \"${folderPrefix}\" not found or empty, considered deletion successful.`);
            return NextResponse.json({ success: true, message: 'Folder not found or empty, presumed deleted.' }, { status: 200 });
            }
        return NextResponse.json({ success: false, error: 'Failed to list folder contents for deletion.', details: listError.message }, { status: 500 });
        }

        if (!listData || listData.length === 0) {
        console.log(`Delete API: No files found under prefix \"${folderPrefix}\". Folder considered empty/deleted.`);
        return NextResponse.json({ success: true, message: 'Folder is empty or already deleted.' }, { status: 200 });
        }

        const filesToRemove = listData.map((file: FileObject) => `${folderPrefix}${file.name}`);
      console.log(`Delete API: Found ${filesToRemove.length} files/subfolders to remove under prefix \"${folderPrefix}\".`);

      const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(filesToRemove);

        if (deleteError) {
        console.error(`Delete API: Error deleting files/subfolders for folder \"${folderPrefix}\":`, deleteError);
        return NextResponse.json({ success: false, error: 'Failed to delete folder contents.', details: deleteError.message }, { status: 500 });
        }

      console.log(`Delete API: Successfully deleted ${filesToRemove.length} items for folder: \"${folderPrefix}\"`);
      return NextResponse.json({ success: true, message: 'Folder deleted successfully.' }, { status: 200 });
    }

  } catch (error) {
    console.error('Delete API: Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: message }, { status: 500 });
  }
} 