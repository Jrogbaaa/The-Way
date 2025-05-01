import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side API endpoint to move files in Supabase Storage
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
    
    // Get request body
    const body = await request.json();
    const { userId, sourcePath, destinationPath, itemType } = body;
    const bucketName = 'gallery-uploads';
    
    // Validate parameters
    if (!userId) {
      return NextResponse.json({ error: 'Missing required userId parameter' }, { status: 400 });
    }
    
    if (!sourcePath) {
      return NextResponse.json({ error: 'Missing required sourcePath parameter' }, { status: 400 });
    }
    
    if (!destinationPath) {
      return NextResponse.json({ error: 'Missing required destinationPath parameter' }, { status: 400 });
    }
    
    console.log(`[Server API] Moving ${itemType} from "${userId}/${sourcePath}" to "${userId}/${destinationPath}"`);
    
    // Full paths in storage
    const sourceFullPath = `${userId}/${sourcePath}`;
    const destinationFullPath = `${userId}/${destinationPath}`;
    
    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) {
      return NextResponse.json({ error: 'Error listing storage buckets: ' + bucketsError.message }, { status: 500 });
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    if (!bucketExists) {
      return NextResponse.json({ error: `Bucket "${bucketName}" does not exist` }, { status: 404 });
    }
    
    if (itemType === 'file') {
      // For files:
      // 1. Download the file
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(bucketName)
        .download(sourceFullPath);
        
      if (downloadError) {
        return NextResponse.json({ 
          error: 'Error downloading file: ' + downloadError.message,
          details: JSON.stringify(downloadError)
        }, { status: 500 });
      }
      
      if (!fileData) {
        return NextResponse.json({ error: 'File data is empty or not found' }, { status: 404 });
      }
      
      // 2. Upload to new location
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(destinationFullPath, fileData, {
          upsert: true
        });
        
      if (uploadError) {
        return NextResponse.json({ 
          error: 'Error uploading file to new location: ' + uploadError.message,
          details: JSON.stringify(uploadError)
        }, { status: 500 });
      }
      
      // 3. Delete original
      const { error: deleteError } = await supabaseAdmin.storage
        .from(bucketName)
        .remove([sourceFullPath]);
        
      if (deleteError) {
        console.warn('[Server API] Error deleting original file:', deleteError);
        // Continue even if there's an error deleting the original
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'File moved successfully'
      });
    } else if (itemType === 'folder') {
      // For folders (more complex):
      // 1. List all files in the folder
      const { data: folderContents, error: listError } = await supabaseAdmin.storage
        .from(bucketName)
        .list(sourceFullPath, { 
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (listError) {
        return NextResponse.json({ 
          error: 'Error listing folder contents: ' + listError.message,
          details: JSON.stringify(listError)
        }, { status: 500 });
      }
      
      // Process results
      const successfulMoves = [];
      const failedMoves = [];
      
      // 2. For each file, download and upload to new location
      if (folderContents && folderContents.length > 0) {
        for (const item of folderContents) {
          try {
            const sourceItemPath = `${sourceFullPath}${item.name}`;
            const destItemPath = `${destinationFullPath}${item.name}`;
            
            // Download file
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
              .from(bucketName)
              .download(sourceItemPath);
              
            if (downloadError || !fileData) {
              console.error(`[Server API] Error downloading file: ${sourceItemPath}`, downloadError);
              failedMoves.push(item.name);
              continue;
            }
            
            // Upload to new location
            const { error: uploadError } = await supabaseAdmin.storage
              .from(bucketName)
              .upload(destItemPath, fileData, {
                upsert: true
              });
              
            if (uploadError) {
              console.error(`[Server API] Error uploading file: ${destItemPath}`, uploadError);
              failedMoves.push(item.name);
              continue;
            }
            
            successfulMoves.push(item.name);
          } catch (itemError) {
            console.error('[Server API] Error processing item:', item.name, itemError);
            failedMoves.push(item.name);
          }
        }
        
        // 3. Delete original files
        const filesToDelete = successfulMoves.map(name => `${sourceFullPath}${name}`);
        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucketName)
            .remove(filesToDelete);
            
          if (deleteError) {
            console.warn('[Server API] Error deleting original files:', deleteError);
          }
        }
      }
      
      // Create .keep file in the destination folder if needed
      const { error: keepError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(`${destinationFullPath}.keep`, new Blob(['']), {
          contentType: 'text/plain',
          upsert: true
        });
        
      if (keepError) {
        console.warn('[Server API] Error creating .keep file:', keepError);
      }
      
      // Try to delete the original .keep file
      await supabaseAdmin.storage
        .from(bucketName)
        .remove([`${sourceFullPath}.keep`]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Folder moved successfully',
        details: {
          successful: successfulMoves.length,
          failed: failedMoves.length,
          failedItems: failedMoves
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid item type. Must be "file" or "folder"' }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('[Server API] Unexpected error in move-file endpoint:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 