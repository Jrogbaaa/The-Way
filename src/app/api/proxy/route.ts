import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for handling image requests to bypass CORS restrictions
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the url from the request query parameter
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }
    
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Fetch the image from the original source
    const imageResponse = await fetch(decodedUrl);
    
    if (!imageResponse.ok) {
      return new NextResponse(`Failed to fetch image: ${imageResponse.statusText}`, { 
        status: imageResponse.status 
      });
    }
    
    // Get the image data as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Create a response with the image data
    const response = new NextResponse(imageBuffer);
    
    // Set appropriate headers from the original response
    const contentType = imageResponse.headers.get('content-type');
    if (contentType) {
      response.headers.set('content-type', contentType);
    }
    
    // Set cache control for efficient caching
    response.headers.set('cache-control', 'public, max-age=31536000, immutable');
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    
    return response;
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 