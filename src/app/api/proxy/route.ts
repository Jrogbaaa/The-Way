import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: GET /api/proxy
 * Proxies image requests to external URLs (primarily `replicate.delivery`)
 * to bypass browser CORS restrictions when displaying images in `<img>` tags.
 * 
 * Workflow:
 * 1. Receives the target image URL via the `url` query parameter.
 * 2. Decodes the target URL.
 * 3. Attempts to fetch the image from the target URL with retry logic.
 * 4. Handles potential `application/octet-stream` content type from Replicate by
 *    inferring the correct image MIME type from the file extension.
 * 5. Streams the image data back to the client with appropriate headers.
 */
export async function GET(request: NextRequest) {
  // Extract the url from the request query parameter
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  let decodedUrl: string | null = null;
  
  try {
    if (!imageUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }
    
    // Decode the URL if it's encoded
    decodedUrl = decodeURIComponent(imageUrl);
    
    console.log('Proxying image URL:', decodedUrl);
    
    // Add retry logic for Replicate URLs (they can sometimes take time to become available)
    const maxRetries = 3;
    let lastError: unknown = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add a slight delay between retries (except first attempt)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          console.log(`Proxy Retry attempt ${attempt + 1} for image:`, decodedUrl);
        }
        
        // Fetch the image from the original source with proper headers
        const imageResponse = await fetch(decodedUrl, {
          headers: {
            'Accept': 'image/*, */*',
            'User-Agent': 'NextJS-Image-Proxy'
          },
          // Increase timeout for large images
          signal: AbortSignal.timeout(15000)
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
        
        // Check if we actually got an image or allowed octet-stream from replicate
        const contentType = imageResponse.headers.get('content-type');
        const isReplicateUrl = decodedUrl.includes('replicate.delivery');
        const isAllowedContentType = 
            (contentType && contentType.startsWith('image/')) || 
            (isReplicateUrl && contentType === 'application/octet-stream');

        if (!isAllowedContentType) {
          console.warn('Proxy rejected content type:', { contentType, url: decodedUrl });
          throw new Error(`Unexpected or disallowed content type: ${contentType}`);
        }
        
        // Get the image data as a buffer
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Verify we have actual data
        if (imageBuffer.byteLength === 0) {
          throw new Error('Image response was empty');
        }
        
        // Create a response with the image data
        const response = new NextResponse(imageBuffer);
        
        // --- Set appropriate headers from the original response OR INFER --- 
        let responseContentType = contentType;
        // If octet-stream from replicate, try to infer from URL extension
        if (isReplicateUrl && contentType === 'application/octet-stream') {
            const extension = decodedUrl.split('.').pop()?.toLowerCase();
            if (extension === 'png') responseContentType = 'image/png';
            else if (extension === 'jpg' || extension === 'jpeg') responseContentType = 'image/jpeg';
            else if (extension === 'webp') responseContentType = 'image/webp';
            else if (extension === 'gif') responseContentType = 'image/gif';
            // Keep octet-stream if extension is unknown/missing
            console.log(`Inferred content type ${responseContentType} from URL extension .${extension}`);
        }

        if (responseContentType) {
          response.headers.set('content-type', responseContentType);
        } else {
           // Fallback if somehow content type is null even after checks 
           response.headers.set('content-type', 'application/octet-stream');
           console.warn('Proxy falling back to octet-stream due to missing content type');
        }
        
        // Set cache control for efficient caching
        response.headers.set('cache-control', 'public, max-age=31536000, immutable');
        
        // Set CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET');
        
        return response;
      } catch (error) {
        // --- DETAILED LOGGING IN RETRY LOOP CATCH --- 
        console.error(`Image proxy fetch/processing error (attempt ${attempt + 1}):`, {
            message: error instanceof Error ? error.message : String(error),
            url: decodedUrl,
            attempt: attempt + 1,
            stack: error instanceof Error ? error.stack : undefined 
        });
        lastError = error;
        if (attempt === maxRetries - 1) {
          console.error('Proxy failed after all retries.');
          throw lastError; 
        }
      }
    }
    
    console.warn('Proxy: Reached code after retry loop unexpectedly.');
    throw lastError || new Error('Failed to fetch image after retries');
    
  } catch (error) {
    // --- DETAILED LOGGING IN FINAL CATCH --- 
    console.error('Final Image proxy error after retries or initial failure:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownErrorType',
      url: imageUrl,
      decodedUrl: decodedUrl ?? 'Decoding failed or URL missing',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a helpful error response with status code
    return new NextResponse(JSON.stringify({
      error: 'Image Proxy Failed', // Generic message for client
      detail: error instanceof Error ? error.message : 'Internal Server Error',
      url: imageUrl // Include original requested url for context
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 