import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import BriaClient from '@/lib/bria-sdk';
import sharp from 'sharp';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || ''
};

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/edit-image: Starting request processing');
    
    // Parse FormData
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!processEnv.BRIA_API_KEY) {
      console.error('BRIA AI API key not configured');
      return NextResponse.json({ error: 'BRIA AI API key not configured' }, { status: 500 });
    }

    if (!imageFile || !prompt) {
      console.error('Image or prompt missing from request');
      return NextResponse.json({ error: 'Image and prompt are required' }, { status: 400 });
    }

    console.log(`Image file received: ${imageFile.name} ${imageFile.type} ${imageFile.size} bytes`);
    console.log(`Prompt received: ${prompt}`);

    // Convert the file to an ArrayBuffer and create buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Initialize the BRIA client with the API key
    const briaClient = new BriaClient(processEnv.BRIA_API_KEY);
    
    // Get image dimensions using sharp
    let width = 1024; // Default width if we can't determine actual dimensions
    let height = 1024; // Default height if we can't determine actual dimensions
    
    try {
      const metadata = await sharp(imageBuffer).metadata();
      if (metadata.width && metadata.height) {
        width = metadata.width;
        height = metadata.height;
      }
    } catch (err) {
      console.warn('Could not determine image dimensions, using defaults:', err);
    }
    
    // Create a full-image white mask
    const maskBuffer = await createWhiteMask(width, height);
    
    console.log(`Using BRIA AI gen_fill API for image editing`);
    
    // Use the editImage method which uses gen_fill internally
    const result = await briaClient.editImage(
      imageBuffer,
      maskBuffer,
      prompt
    );
    
    // Return the image directly
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.data.length.toString(),
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Error in edit-image API route:', error);
    
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
        { error: 'Failed to edit image', details: errorData },
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
      { error: 'Failed to edit image', message: axiosError.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Creates a white mask image of the specified dimensions using sharp
 */
async function createWhiteMask(width: number, height: number): Promise<Buffer> {
  // Create a solid white image using sharp
  return await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 }
    }
  })
  .png()
  .toBuffer();
} 