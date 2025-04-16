import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

// Environment variables
const BRIA_API_KEY = process.env.BRIA_AI_API_KEY;
const BRIA_BASE_URL = process.env.BRIA_AI_BASE_URL;

export async function POST(req: NextRequest) {
  if (!BRIA_API_KEY) {
    console.error('BRIA AI API key not configured');
    return NextResponse.json({ error: 'Server configuration error: BRIA AI API key missing' }, { status: 500 });
  }
  if (!BRIA_BASE_URL) {
    console.error('BRIA AI Base URL not configured');
    return NextResponse.json({ error: 'Server configuration error: BRIA AI Base URL missing' }, { status: 500 });
  }

  try {
    const requestFormData = await req.formData();
    const imageFile = requestFormData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    console.log('Received request for /api/bria/increase-resolution');
    console.log(`Processing image: ${imageFile.name}, Size: ${imageFile.size}, Type: ${imageFile.type}`);

    const endpoint = `${BRIA_BASE_URL}/increase_resolution`;
    console.log(`Calling Bria AI endpoint via fetch: ${endpoint}`);
    console.log(`BRIA API Key Type: ${typeof BRIA_API_KEY}, Length: ${BRIA_API_KEY?.length}`);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'api-token': BRIA_API_KEY,
        },
        body: requestFormData,
    });

    console.log(`Bria AI response status: ${response.status}`);

    if (!response.ok) {
        let errorDetails: any = {};
        let errorMessage = `Bria API Error: ${response.statusText} (Status: ${response.status})`;
        try {
            errorDetails = await response.json();
            errorMessage = errorDetails.message || errorDetails.error || errorMessage;
            console.error('Bria API Error Details (JSON):', errorDetails);
        } catch (e) {
            const errorText = await response.text();
            errorDetails = { raw: errorText };
            console.error('Bria API Error (non-JSON):', errorText);
            errorMessage = errorText || errorMessage;
        }
        const error = new Error(errorMessage);
        (error as any).details = errorDetails;
        (error as any).statusCode = response.status;
        throw error;
    }

    console.log('Successfully received response from Bria AI /increase_resolution');

    const imageArrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(imageArrayBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': imageArrayBuffer.byteLength.toString(),
        },
    });

  } catch (error: any) {
    console.error('Error in /api/bria/increase-resolution:', error);
    const errorMessage = error.message || 'Failed to upscale image';
    const statusCode = error.statusCode || 500;
    const errorDetails = error.details || {};

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: statusCode }
    );
  }
} 