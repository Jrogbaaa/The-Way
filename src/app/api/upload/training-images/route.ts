import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';

// Training images bucket name
const TRAINING_BUCKET_NAME = 'training-uploads';

// Function to upload file to temporary public hosting (keep for localhost)
async function uploadToTempFileHost(file: Buffer, filename: string): Promise<string | null> {
  try {
    // Use tmpfiles.org as a simple temporary file host
    const formData = new FormData();
    const blob = new Blob([file], { type: 'application/zip' });
    formData.append('file', blob, filename);
    
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && result.data && result.data.url) {
        // Convert tmpfiles.org URL to direct download URL
        // Format: https://tmpfiles.org/dl/123456/filename.zip
        const originalUrl = result.data.url;
        const urlParts = originalUrl.split('/');
        const fileId = urlParts[urlParts.length - 2]; // Get the ID part
        const fileName = urlParts[urlParts.length - 1]; // Get the filename
        const directUrl = `https://tmpfiles.org/dl/${fileId}/${fileName}`;
        console.log(`File uploaded to temporary host: ${directUrl}`);
        return directUrl;
      }
    }
    
    console.error('Failed to upload to temporary host:', await response.text());
    return null;
  } catch (error) {
    console.error('Error uploading to temporary host:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/upload/training-images called');
  
  try {
    // Initialize Supabase client
    const supabase = await createClient('TrainingUpload');
    
    // Note: Authentication is not required for file uploads
    // This allows unauthenticated users to upload files before signing in
    // We'll use anonymous session-based file organization
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log(`Received request with ${files?.length || 0} files`);
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`Received ${files.length} files for upload`);

    const uploadedFiles = [];
    // Use a session-based identifier for file organization
    const uploadSession = nanoid();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file || !file.size) {
        console.warn(`Skipping empty or invalid file at index ${i}:`, file?.name || 'unnamed');
        continue;
      }

      console.log(`Processing file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes, ${file.type})`);

      // Validate file type
      const isValidImage = file.type.startsWith('image/') && 
        ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidZip = file.type === 'application/zip' || 
        file.name.toLowerCase().endsWith('.zip');

      if (!isValidImage && !isValidZip) {
        console.error(`Invalid file type: ${file.type} for file: ${file.name}`);
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.type}. Only images and ZIP files are allowed.` },
          { status: 400 }
        );
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        console.error(`File too large: ${file.name} (${file.size} bytes > ${maxSize} bytes)`);
        return NextResponse.json(
          { success: false, error: `File ${file.name} is too large. Maximum size is 50MB.` },
          { status: 413 }
        );
      }

      // Generate unique filename using upload session
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `session-${uploadSession}-${i}-${Date.now()}.${fileExtension}`;
      const storagePath = `training/${uploadSession}/${uniqueFilename}`;

      // Upload to Supabase storage
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(TRAINING_BUCKET_NAME)
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading file ${uniqueFilename} to Supabase:`, uploadError);
          return NextResponse.json(
            { success: false, error: `Failed to upload file: ${file.name}. ${uploadError.message}` },
            { status: 500 }
          );
        }

        console.log(`Successfully uploaded file to Supabase: ${storagePath} (${file.size} bytes)`);
        
        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from(TRAINING_BUCKET_NAME)
          .getPublicUrl(storagePath);

        const publicUrl = publicUrlData.publicUrl;
        console.log(`File accessible at public URL: ${publicUrl}`);

        uploadedFiles.push({
          originalName: file.name,
          filename: uniqueFilename,
          size: file.size,
          type: file.type,
          url: publicUrl,
          publicUrl: publicUrl,
          storagePath: storagePath
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return NextResponse.json(
          { success: false, error: `Failed to process file: ${file.name}` },
          { status: 500 }
        );
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid files were uploaded' },
        { status: 400 }
      );
    }

    // If there's a single ZIP file, use that as the training images URL
    const zipFile = uploadedFiles.find(file => 
      file.type === 'application/zip' || file.originalName.toLowerCase().endsWith('.zip')
    );
    
    const response = {
      success: true,
      uploadSession,
      files: uploadedFiles,
      trainingImagesUrl: zipFile ? zipFile.publicUrl : null,
      imageFiles: uploadedFiles.filter(file => file.type.startsWith('image/')),
      zipFile: zipFile || null,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      storage: 'supabase'
    };

    console.log('Upload response:', { 
      success: response.success, 
      filesCount: response.files.length, 
      hasZip: !!response.zipFile,
      storage: response.storage
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 