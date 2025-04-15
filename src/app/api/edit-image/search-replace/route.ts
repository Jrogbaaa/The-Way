import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import BriaClient from '@/lib/bria-sdk';

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/edit-image/search-replace: Starting request processing');
    
    // Parse FormData
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const targetText = formData.get('target_text') as string;
    const replacementText = formData.get('replacement_text') as string;

    // Check for BRIA API key
    const briaApiKey = process.env.BRIA_AI_API_KEY;
    if (!briaApiKey) {
      console.error('BRIA API key not configured');
      return NextResponse.json({ 
        error: 'API key not configured',
        message: 'Please set BRIA_AI_API_KEY in your environment variables'
      }, { status: 500 });
    }

    if (!imageFile) {
      console.error('Image missing from request');
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!targetText) {
      console.error('Target text missing from request');
      return NextResponse.json({ error: 'Target text is required' }, { status: 400 });
    }

    if (!replacementText) {
      console.error('Replacement text missing from request');
      return NextResponse.json({ error: 'Replacement text is required' }, { status: 400 });
    }

    console.log(`Image file received: ${imageFile.name}, size: ${imageFile.size}, searchText: ${targetText}, replaceText: ${replacementText}`);

    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Initialize the BriaClient
    const briaClient = new BriaClient(briaApiKey);
    console.log('Using BRIA AI for search and replace...');
    
    // Use the searchReplace method
    const result = await briaClient.searchReplace(
      imageBuffer,
      targetText,
      replacementText
    );
    
    // Return the image directly
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.data.length.toString(),
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error: any) {
    console.error('Error in search-replace API route:', error);
    
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
        { error: 'Failed to search-replace text in image', details: errorData },
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
      { error: 'Failed to search-replace text in image', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 