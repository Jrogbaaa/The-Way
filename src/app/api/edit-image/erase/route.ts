import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import BriaClient from '@/lib/bria-sdk';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || ''
};

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/edit-image/erase: Starting request processing');
    
    // Parse FormData
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const maskFile = formData.get('mask') as File;

    if (!processEnv.BRIA_API_KEY) {
      console.error('BRIA API key not configured');
      return NextResponse.json({ error: 'BRIA API key not configured' }, { status: 500 });
    }

    if (!imageFile || !maskFile) {
      console.error('Image or mask missing from request');
      return NextResponse.json({ error: 'Image and mask are required' }, { status: 400 });
    }

    console.log(`Image file received: ${imageFile.name} ${imageFile.type} ${imageFile.size} bytes`);
    console.log(`Mask file received: ${maskFile.name} ${maskFile.type} ${maskFile.size} bytes`);

    // Convert image and mask to buffers
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const maskBuffer = Buffer.from(await maskFile.arrayBuffer());
    
    console.log('Using BRIA AI erase API...');
    
    // Initialize BRIA client
    const briaClient = new BriaClient(processEnv.BRIA_API_KEY);
    
    // Use the erase method
    const result = await briaClient.erase(imageBuffer, maskBuffer);
    
    // Return the image directly
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.data.length.toString(),
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error: any) {
    console.error('Error in erase API route:', error);
    
    // Get more detailed error information
    if (error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);
      
      // For arraybuffer responses, we need to convert to string to see error details
      let errorData = error.response.data;
      if (errorData instanceof ArrayBuffer) {
        try {
          errorData = JSON.parse(Buffer.from(errorData).toString('utf8'));
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
      }
      console.error('API Error Data:', errorData);
      
      return NextResponse.json(
        { error: 'Failed to erase from image', details: errorData },
        { status: error.response.status || 500 }
      );
    } else if (error.request) {
      console.error('No response received:', error.request);
      return NextResponse.json(
        { error: 'No response received from API', details: 'The request was made but no response was received' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to erase from image', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 