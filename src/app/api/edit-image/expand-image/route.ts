import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import BriaClient from '@/lib/bria-sdk';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || ''
};

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/edit-image/expand-image: Starting request processing');
    
    // Parse FormData
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const direction = formData.get('direction') as string;
    const prompt = formData.get('prompt') as string || '';

    if (!processEnv.BRIA_API_KEY) {
      console.error('BRIA AI API key not configured');
      return NextResponse.json({ error: 'BRIA AI API key not configured' }, { status: 500 });
    }

    if (!imageFile) {
      console.error('Image missing from request');
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!direction) {
      console.error('Direction missing from request');
      return NextResponse.json({ error: 'Direction is required (top, bottom, left, right)' }, { status: 400 });
    }

    console.log(`Image file received: ${imageFile.name} ${imageFile.type} ${imageFile.size} bytes`);
    console.log(`Expanding in direction: ${direction}`);
    if (prompt) {
      console.log(`Using prompt: ${prompt}`);
    }

    // Convert the file to an ArrayBuffer and create buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    console.log('Using BRIA AI image expansion API...');
    
    // Initialize the BRIA client with the API key
    const briaClient = new BriaClient(processEnv.BRIA_API_KEY);
    
    // Use the expandImage method
    const result = await briaClient.expandImage(imageBuffer, direction, prompt);
    
    // Return the image directly
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.data.length.toString(),
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Error in expand-image API route:', error);
    
    // Get more detailed error information
    const axiosError = error as any;
    if (axiosError.response) {
      console.error('API Error Status:', axiosError.response.status);
      console.error('API Error Headers:', axiosError.response.headers);
      
      // For arraybuffer responses, we need to convert to string to see error details
      let errorData = axiosError.response.data;
      if (errorData instanceof ArrayBuffer) {
        try {
          errorData = JSON.parse(Buffer.from(errorData).toString('utf8'));
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
      }
      console.error('API Error Data:', errorData);
      
      return NextResponse.json(
        { error: 'Failed to expand image', details: errorData },
        { status: axiosError.response.status || 500 }
      );
    } else if (axiosError.request) {
      console.error('No response received:', axiosError.request);
      return NextResponse.json(
        { error: 'No response received from API', details: 'The request was made but no response was received' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to expand image', message: axiosError.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 