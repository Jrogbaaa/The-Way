import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

// Function to check if a file is an image based on MIME type or extension
function isImageFile(name: string, data: Uint8Array): boolean {
  // Check file extension
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];
  const hasValidExtension = validExtensions.some(ext => 
    name.toLowerCase().endsWith(ext)
  );
  
  // Check file signature (magic bytes) for common image formats
  // JPEG signature
  if (data.length > 2 && data[0] === 0xFF && data[1] === 0xD8) {
    return true;
  }
  
  // PNG signature
  if (data.length > 8 && 
      data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47 && 
      data[4] === 0x0D && data[5] === 0x0A && data[6] === 0x1A && data[7] === 0x0A) {
    return true;
  }
  
  // If we can't check the magic bytes, fall back to extension check
  return hasValidExtension;
}

export async function POST(request: NextRequest) {
  try {
    // Get the FormData from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided', valid: false },
        { status: 400 }
      );
    }

    // Validate it's a ZIP file
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      return NextResponse.json(
        { message: 'Only ZIP files are allowed', valid: false },
        { status: 400 }
      );
    }

    // Load the ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(arrayBuffer);

    // Track validation results
    let totalFiles = 0;
    let validImageFiles = 0;
    const invalidFiles: string[] = [];

    // Examine each file in the ZIP
    for (const [fileName, zipEntry] of Object.entries(zipContents.files)) {
      // Skip directories
      if (zipEntry.dir) {
        continue;
      }
      
      totalFiles++;
      
      // Get the file data
      const fileData = await zipEntry.async('uint8array');
      
      // Check if it's an image file
      if (isImageFile(fileName, fileData)) {
        validImageFiles++;
      } else {
        invalidFiles.push(fileName);
      }
    }

    // Validation rules:
    // 1. ZIP must contain at least one file
    // 2. All files must be valid images
    const isValid = totalFiles > 0 && validImageFiles === totalFiles;

    return NextResponse.json({
      valid: isValid,
      totalFiles,
      validImageFiles,
      invalidFiles,
      message: isValid 
        ? 'ZIP file contains valid images'
        : 'ZIP file contains non-image files or is empty'
    });
  } catch (error) {
    console.error('Error validating ZIP file:', error);
    return NextResponse.json(
      { 
        message: 'Error processing ZIP file', 
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}; 