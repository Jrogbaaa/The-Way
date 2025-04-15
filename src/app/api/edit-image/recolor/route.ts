import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import BriaClient from '@/lib/bria-sdk';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || ''
};

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/edit-image/recolor: Starting request processing');
    
    // Parse FormData
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const objectName = formData.get('object_name') as string;
    const colorName = formData.get('color_name') as string;

    if (!processEnv.BRIA_API_KEY) {
      console.error('BRIA AI API key not configured');
      return NextResponse.json({ error: 'BRIA AI API key not configured' }, { status: 500 });
    }

    if (!imageFile) {
      console.error('Image missing from request');
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!objectName) {
      console.error('Object name missing from request');
      return NextResponse.json({ error: 'Object name is required' }, { status: 400 });
    }

    if (!colorName) {
      console.error('Color name missing from request');
      return NextResponse.json({ error: 'Color name is required' }, { status: 400 });
    }

    console.log(`Image file received: ${imageFile.name} ${imageFile.type} ${imageFile.size} bytes`);
    console.log(`Color item: ${objectName} `);
    console.log(`Target color: ${colorName} `);

    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    console.log('Using BRIA AI for recoloring objects');
    
    // Initialize the BriaClient
    const briaClient = new BriaClient(processEnv.BRIA_API_KEY);
    
    // Use the recolor method
    const result = await briaClient.recolor(imageBuffer, objectName, colorName);
    
    // Return the image directly
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.data.length.toString(),
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error: any) {
    console.error('Error in recolor API route:', error);
    
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
        { error: 'Failed to recolor object in image', details: errorData },
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
      { error: 'Failed to recolor object in image', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 