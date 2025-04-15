import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    // Get the FormData from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      return NextResponse.json(
        { message: 'Only ZIP files are allowed' },
        { status: 400 }
      );
    }

    // Generate a unique file name
    const fileName = `${uuidv4()}-${file.name}`;
    
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Check if Supabase is configured
    if (supabase && supabaseUrl && supabaseKey) {
      try {
        // Upload to Supabase Storage
        const { data, error } = await supabase
          .storage
          .from('model-training')
          .upload(`uploads/${fileName}`, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get the public URL for the file
        const { data: publicUrlData } = supabase
          .storage
          .from('model-training')
          .getPublicUrl(`uploads/${fileName}`);

        return NextResponse.json({
          message: 'File uploaded successfully to Supabase',
          url: publicUrlData.publicUrl,
          fileName
        });
      } catch (error) {
        console.error('Error uploading to Supabase storage:', error);
        // Fall through to local storage as a fallback
      }
    }

    // Fallback to local storage if Supabase fails or isn't configured
    console.log('Using local storage fallback for file upload');
    
    // Create the upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Write the file to local storage
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    // Generate a local public URL
    const publicUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({
      message: 'File uploaded successfully to local storage',
      url: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

// Make route handler handle files up to 100MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}; 