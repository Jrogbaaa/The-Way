import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for handling image requests to bypass CORS restrictions
 * Enhanced to better handle Replicate API image URLs
 */
export async function GET(request: NextRequest) {
  // Extract the url from the request query parameter
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  try {
    if (!imageUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }
    
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(imageUrl);
    
    console.log('Proxying image URL:', decodedUrl);
    
    // Add retry logic for Replicate URLs (they can sometimes take time to become available)
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add a slight delay between retries (except first attempt)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          console.log(`Retry attempt ${attempt + 1} for image:`, decodedUrl);
        }
        
        // Fetch the image from the original source with proper headers
        const imageResponse = await fetch(decodedUrl, {
          headers: {
            'Accept': 'image/*, */*',
            'User-Agent': 'NextJS-Image-Proxy'
          },
          // Increase timeout for large images
          signal: AbortSignal.timeout(10000)
        });
        
        // Log detailed information for troubleshooting
        console.log('Image fetch response:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          contentType: imageResponse.headers.get('content-type'),
          contentLength: imageResponse.headers.get('content-length')
        });
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        // Check if we actually got an image
        const contentType = imageResponse.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          throw new Error(`Unexpected content type: ${contentType}`);
        }
        
        // Get the image data as a buffer
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Verify we have actual data
        if (imageBuffer.byteLength === 0) {
          throw new Error('Image response was empty');
        }
        
        // Create a response with the image data
        const response = new NextResponse(imageBuffer);
        
        // Set appropriate headers from the original response
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
        console.error(`Image proxy error (attempt ${attempt + 1}):`, error);
        lastError = error;
        // Continue to next retry attempt unless it's the last one
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    // This should not be reached due to the throw in the loop, but just in case
    throw lastError || new Error('Failed to fetch image after retries');
    
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return a helpful error response with status code
    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal Server Error',
      url: imageUrl
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 