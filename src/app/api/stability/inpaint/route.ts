import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

// Helper function to convert Data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return blob;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.STABILITY_API_KEY;

  if (!apiKey) {
    console.error('Stability API key not configured');
    return NextResponse.json(
      { error: 'Stability API key not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { image, mask, prompt } = body;

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: 'Missing required parameters: image, mask, or prompt' },
        { status: 400 }
      );
    }

    console.log('Received Stability inpaint request with prompt:', prompt);
    // Convert data URLs to Blobs
    const imageBlob = await dataUrlToBlob(image);
    const maskBlob = await dataUrlToBlob(mask);

    // Prepare form data
    const formData = new FormData();
    formData.append('init_image', imageBlob, 'init_image.png');
    formData.append('mask_image', maskBlob, 'mask_image.png');
    formData.append('mask_source', 'MASK_IMAGE_BLACK'); // Or MASK_IMAGE_WHITE depending on mask format
    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1'); // Optional weight
    formData.append('cfg_scale', '7'); // Default is 7
    formData.append('samples', '1'); // Number of images to generate
    formData.append('steps', '30'); // Default is 30
    // Add other parameters as needed, e.g., 'style_preset', 'seed', etc.

    // Choose the appropriate engine ID for inpainting
    // Examples: stable-diffusion-xl-1024-v1-0, stable-inpainting-v1-0, stable-inpainting-512-v2-0
    // Check Stability AI docs for the best/latest model
    const engineId = 'stable-diffusion-xl-1024-v1-0'; // Or 'stable-inpainting-512-v2-0' etc.
    const apiHost = 'https://api.stability.ai';
    const apiUrl = `${apiHost}/v1/generation/${engineId}/image-to-image/masking`;

    console.log(`Calling Stability AI API: ${apiUrl} with engine: ${engineId}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json', // Request JSON response for error details
        Authorization: `Bearer ${apiKey}`,
        // 'Content-Type' is set automatically by fetch for FormData
      },
      body: formData,
    });

    if (!response.ok) {
        // Read the response body as text first, as error messages might not be JSON
        const errorText = await response.text();
        let errorDetails;
        try {
            // Attempt to parse the text as JSON
            errorDetails = JSON.parse(errorText);
            console.error('Stability AI API Error (JSON parsed):', errorDetails);
        } catch (e) {
            // If JSON parsing fails, use the raw text
            console.error('Stability AI API Error (Text):', errorText);
            // Limit the text length in the response to avoid overly large error messages
            errorDetails = { message: errorText.substring(0, 500) + (errorText.length > 500 ? '...' : '') }; 
        }
        
        return NextResponse.json(
            { error: 'Stability AI API request failed.', details: errorDetails },
            { status: response.status }
        );
    }

    // Stability AI returns the image directly for sync requests
    // The response body IS the image data (e.g., PNG)
    // We need to read it as an ArrayBuffer and convert to base64 to send back as JSON
    const imageArrayBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    console.log('Stability AI inpainting successful.');

    // Send the generated image back to the client
    return NextResponse.json({ generatedImage: imageDataUrl });

  } catch (error) {
    console.error('Error processing Stability inpaint request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to process inpaint request.', details: errorMessage },
      { status: 500 }
    );
  }
} 