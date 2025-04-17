import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: POST /api/replicate/genfill
 * This is an alias for the inpaint endpoint.
 * GenFill uses the same underlying technology as inpainting, just with a different UI presentation.
 */
export async function POST(req: NextRequest) {
  console.log('Received request for /api/replicate/genfill POST - forwarding to inpaint');
  
  // Forward this request to the inpaint endpoint
  const inpaintUrl = new URL('/api/replicate/inpaint', req.url);
  
  // Clone the request body
  const clonedRequest = new NextRequest(inpaintUrl, {
    method: 'POST',
    body: req.body,
    headers: req.headers,
  });
  
  // Simply forward the response from the inpaint endpoint
  const response = await fetch(clonedRequest);
  
  // Return the exact same response
  return response;
} 