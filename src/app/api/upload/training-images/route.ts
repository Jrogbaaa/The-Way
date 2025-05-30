import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';

// Function to upload file to temporary public hosting
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
    // Note: Authentication is not required for file uploads
    // This allows unauthenticated users to upload files before signing in
    // The actual training will require authentication later
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`Received ${files.length} files for upload`);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'training');
    await mkdir(uploadsDir, { recursive: true });

    const uploadedFiles = [];
    // Use a session-based or anonymous identifier for file organization
    const uploadSession = nanoid(); // Generate unique session ID for this upload

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.size) {
        console.warn(`Skipping empty file: ${file.name}`);
        continue;
      }

      // Validate file type
      const isValidImage = file.type.startsWith('image/') && 
        ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidZip = file.type === 'application/zip' || 
        file.name.toLowerCase().endsWith('.zip');

      if (!isValidImage && !isValidZip) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only images and ZIP files are allowed.` },
          { status: 400 }
        );
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 50MB.` },
          { status: 400 }
        );
      }

      // Generate unique filename using upload session instead of user ID
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `session-${uploadSession}-${i}-${Date.now()}.${fileExtension}`;
      const filePath = join(uploadsDir, uniqueFilename);

      // Write file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      console.log(`Uploaded file: ${uniqueFilename} (${file.size} bytes)`);

      // Check if we need to upload to public hosting for Replicate access
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      let publicUrl = `${baseUrl}/uploads/training/${uniqueFilename}`;
      
      // If this is a ZIP file and we're using localhost, upload to temporary public hosting
      if (isLocalhost && (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip'))) {
        console.log('Localhost detected, uploading ZIP file to temporary public hosting for Replicate access...');
        const tempUrl = await uploadToTempFileHost(buffer, uniqueFilename);
        if (tempUrl) {
          publicUrl = tempUrl;
          console.log(`ZIP file available at public URL: ${publicUrl}`);
        } else {
          console.warn('Failed to upload to temporary hosting, using localhost URL (training may fail)');
        }
      }

      uploadedFiles.push({
        originalName: file.name,
        filename: uniqueFilename,
        size: file.size,
        type: file.type,
        url: `/uploads/training/${uniqueFilename}`,
        publicUrl: publicUrl
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded' },
        { status: 400 }
      );
    }

    // If there's a single ZIP file, use that as the training images URL
    const zipFile = uploadedFiles.find(file => 
      file.type === 'application/zip' || file.originalName.toLowerCase().endsWith('.zip')
    );

    // Check if we're using localhost and warn about Replicate accessibility
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    
    // Check if any ZIP files were uploaded to public hosting
    const hasPublicZipFiles = uploadedFiles.some(file => 
      (file.type === 'application/zip' || file.originalName.toLowerCase().endsWith('.zip')) &&
      !file.publicUrl.includes('localhost')
    );
    
    const response = {
      success: true,
      uploadSession, // Return the session ID instead of user ID
      files: uploadedFiles,
      trainingImagesUrl: zipFile ? zipFile.publicUrl : null,
      imageFiles: uploadedFiles.filter(file => file.type.startsWith('image/')),
      zipFile: zipFile || null,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      warning: isLocalhost && !hasPublicZipFiles ? 'Files are stored locally. ZIP files have been uploaded to temporary public hosting for Replicate training.' : null
    };

    console.log('Upload response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 