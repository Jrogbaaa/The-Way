import { createClient } from '@/lib/supabase/server' // Corrected import path and name
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { StorageError, FileObject } from '@supabase/storage-js'

const BUCKET_NAME = 'gallery-uploads';

// Type guard for StorageError (can be reused or placed in a shared utils file)
function isStorageError(error: any): error is StorageError {
  return typeof error === 'object' && error !== null && 'name' in error && 'message' in error;
}

export async function POST(request: NextRequest) {
  // No need for cookieStore here, createClient handles it
  const supabase = await createClient('API/Move'); // Use the correct helper

  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Move API: Auth error:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`Move API: User ${user.id} authenticated.`);

    // 2. Parse Request Body
    let sourcePath: string | undefined;
    let destinationPath: string | undefined;
    let itemType: 'file' | 'folder' | undefined;
    try {
      const body = await request.json();
      sourcePath = body.sourcePath?.replace(/^\/|\/$/g, ''); // Clean paths
      destinationPath = body.destinationPath?.replace(/^\/|\/$/g, ''); // Clean paths
      itemType = body.itemType;
      console.log(`Move API: Request received to move ${itemType} from "${sourcePath}" to "${destinationPath}"`);
    } catch (e) {
      console.error('Move API: Invalid JSON body:', e);
      return NextResponse.json({ error: 'Invalid request body. JSON expected.' }, { status: 400 });
    }

    // 3. Validation
    if (!sourcePath || !destinationPath || !itemType) {
      return NextResponse.json({ error: 'Missing sourcePath, destinationPath, or itemType' }, { status: 400 });
    }
    if (itemType !== 'file' && itemType !== 'folder') {
      return NextResponse.json({ error: 'Invalid itemType. Must be "file" or "folder".' }, { status: 400 });
    }
    if (sourcePath === destinationPath) {
      return NextResponse.json({ error: 'Source and destination paths cannot be the same.' }, { status: 400 });
    }

    // Security Check: Ensure paths belong to the user
    if (!sourcePath.startsWith(user.id + '/') && sourcePath !== user.id) {
      console.warn(`Move API: Forbidden attempt by user ${user.id} to access source path "${sourcePath}"`);
      return NextResponse.json({ error: 'Forbidden: Access denied to source path.' }, { status: 403 });
    }
    if (!destinationPath.startsWith(user.id + '/') && destinationPath !== user.id) {
        console.warn(`Move API: Forbidden attempt by user ${user.id} to use destination path "${destinationPath}"`);
        return NextResponse.json({ error: 'Forbidden: Access denied for destination path.' }, { status: 403 });
    }

    // Folder specific validation: Prevent moving a folder into itself
    if (itemType === 'folder') {
        const sourcePrefix = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`;
        const destPrefix = destinationPath.endsWith('/') ? destinationPath : `${destinationPath}/`;
        if (destPrefix.startsWith(sourcePrefix)) {
            return NextResponse.json({ error: 'Cannot move a folder into itself.' }, { status: 400 });
        }
    }

    // 4. Move Logic
    console.log(`Move API: Attempting to move ${itemType} from "${sourcePath}" to "${destinationPath}"`);

    if (itemType === 'file') {
      const { data, error: moveError } = await supabase.storage
        .from(BUCKET_NAME)
        .move(sourcePath, destinationPath);
        // Note: .move overwrites by default if the destination exists.
        // Add { upsert: false } option if you want it to fail instead.

      if (moveError) {
        console.error(`Move API: Error moving file from "${sourcePath}" to "${destinationPath}":`, moveError);
        // Handle specific errors, e.g., source not found
         if (isStorageError(moveError) && moveError.message.includes('Not Found')) {
            return NextResponse.json({ error: 'Source file not found.', details: moveError.message }, { status: 404 });
         }
        return NextResponse.json({ error: 'Failed to move file.', details: moveError.message }, { status: 500 });
      }

      console.log(`Move API: File moved successfully from "${sourcePath}" to "${destinationPath}"`);
      return NextResponse.json({ message: 'File moved successfully' }, { status: 200 });
    }

    if (itemType === 'folder') {
      const { data, error: moveError } = await supabase.storage
        .from(BUCKET_NAME)
        .move(sourcePath, destinationPath);

      if (moveError) {
        console.error(`Move API: Error moving folder from "${sourcePath}" to "${destinationPath}":`, moveError);
        // Handle specific errors, e.g., source not found
         if (isStorageError(moveError) && moveError.message.includes('Not Found')) {
            return NextResponse.json({ error: 'Source folder not found.', details: moveError.message }, { status: 404 });
         }
        return NextResponse.json({ error: 'Failed to move folder.', details: moveError.message }, { status: 500 });
      }

      console.log(`Move API: Folder moved successfully from "${sourcePath}" to "${destinationPath}"`);
      return NextResponse.json({ message: 'Folder moved successfully' }, { status: 200 });
    }
  } catch (e) {
    console.error('Move API: Internal server error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}