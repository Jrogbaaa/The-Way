import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('Gallery Delete Folder API: Received request');

  try {
    // Parse request body
    const body = await request.json();
    const { path, userId } = body;

    if (!path || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Ensure path has trailing slash for folder operations
    const folderPath = path.endsWith('/') ? path : `${path}/`;
    console.log(`Gallery Delete Folder API: Attempting to delete folder at ${userId}/${folderPath}`);

    // Create a direct Supabase client with admin privileges to bypass auth issues
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Also try with the standard server client as a fallback
    const supabaseServer = await createSupabaseServerClient('DeleteFolderAPI');

    // The full folder path in storage
    const fullFolderPath = `${userId}/${folderPath}`;

    // Try with admin client first
    try {
      // Step 1: List all files in the folder
      const { data: folderContents, error: listError } = await supabaseAdmin.storage
        .from('gallery-uploads')
        .list(fullFolderPath, { sortBy: { column: 'name', order: 'asc' } });

      if (listError) {
        console.error('Gallery Delete Folder API: Error listing folder contents:', listError);
        throw listError;
      }

      console.log(`Gallery Delete Folder API: Found ${folderContents?.length || 0} items in folder`);

      // Step 2: Delete all files in the folder
      if (folderContents && folderContents.length > 0) {
        // Collect paths of all items in the folder
        const filePaths = folderContents.map((item: { name: string }) => `${fullFolderPath}${item.name}`);

        console.log(`Gallery Delete Folder API: Deleting ${filePaths.length} files`);

        // Delete files in batches of 10 to avoid potential timeout issues
        for (let i = 0; i < filePaths.length; i += 10) {
          const batch = filePaths.slice(i, i + 10);
          const { error: deleteError } = await supabaseAdmin.storage
            .from('gallery-uploads')
            .remove(batch);

          if (deleteError) {
            console.error(`Gallery Delete Folder API: Error deleting batch ${i/10 + 1}:`, deleteError);
            throw deleteError;
          }
        }
      }

      // Step 3: Also check for and delete the .keep placeholder file
      const keepFilePath = `${userId}/${path}.keep`;
      console.log(`Gallery Delete Folder API: Checking for .keep file at: "${keepFilePath}"`);

      await supabaseAdmin.storage
        .from('gallery-uploads')
        .remove([keepFilePath])
        .then(({ error }: { error: any }) => {
          if (error && !error.message.includes('not found')) {
            console.warn('Gallery Delete Folder API: Error removing .keep file:', error);
          }
        });

      console.log(`Gallery Delete Folder API: Successfully deleted folder: ${fullFolderPath}`);
      return NextResponse.json({ success: true, message: 'Folder deleted successfully' });
    } catch (adminError) {
      console.warn('Gallery Delete Folder API: Admin client failed, trying server client:', adminError);

      // Fallback to server client
      try {
        // Step 1: List all files in the folder
        const { data: folderContents, error: listError } = await supabaseServer.storage
          .from('gallery-uploads')
          .list(fullFolderPath, { sortBy: { column: 'name', order: 'asc' } });

        if (listError) {
          console.error('Gallery Delete Folder API: Error listing folder contents with server client:', listError);
          throw listError;
        }

        // Step 2: Delete all files in the folder
        if (folderContents && folderContents.length > 0) {
          const filePaths = folderContents.map((item: { name: string }) => `${fullFolderPath}${item.name}`);

          // Delete files in batches
          for (let i = 0; i < filePaths.length; i += 10) {
            const batch = filePaths.slice(i, i + 10);
            const { error: deleteError } = await supabaseServer.storage
              .from('gallery-uploads')
              .remove(batch);

            if (deleteError) {
              console.error(`Gallery Delete Folder API: Error deleting batch with server client ${i/10 + 1}:`, deleteError);
              throw deleteError;
            }
          }
        }

        // Step 3: Delete .keep file
        const keepFilePath = `${userId}/${path}.keep`;
        await supabaseServer.storage
          .from('gallery-uploads')
          .remove([keepFilePath]);

        console.log(`Gallery Delete Folder API: Successfully deleted folder via server client: ${fullFolderPath}`);
        return NextResponse.json({ success: true, message: 'Folder deleted successfully' });
      } catch (serverError) {
        console.error('Gallery Delete Folder API: Server client also failed:', serverError);
        throw serverError;
      }
    }
  } catch (error) {
    console.error('Gallery Delete Folder API: Error processing request:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 