import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

// Helper function to convert Data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // Example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...
  const parts = dataUrl.split(';base64,');
  if (parts.length !== 2) {
    throw new Error('Invalid Data URL format');
  }
  const contentType = parts[0].split(':')[1];
  if (!contentType) {
    throw new Error('Invalid Data URL format: Missing content type');
  }
  const base64Data = parts[1];
  const byteCharacters = Buffer.from(base64Data, 'base64');
  const blob = new Blob([byteCharacters], { type: contentType });
  return blob;
}

export async function POST(req: NextRequest) {
  console.log("Received request at /api/stability/inpaint (using v2beta)");
  
  // Log all available environment variable keys for debugging
  console.log('Available process.env keys:', Object.keys(process.env).length > 50 ? Object.keys(process.env).slice(0, 50).concat('...') : Object.keys(process.env)); // Log fewer keys if too many
  
  // *** Revert API key check back to the non-public version ***
  const apiKey = process.env.STABILITY_AI_API_KEY;
  console.log('STABILITY_AI_API_KEY value:', apiKey ? `Found (length: ${apiKey.length})` : 'Not Found!');

  if (!apiKey) {
    // *** Revert log message ***
    console.error('Stability API key not configured'); 
    return NextResponse.json(
      { error: 'Server configuration error: Stability API key missing.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("Failed to parse request body as JSON:", e);
    return NextResponse.json({ error: 'Invalid request body: Must be JSON.' }, { status: 400 });
  }

  const { image, mask, prompt } = body;

  if (!image || !mask || !prompt) {
    console.log('Missing required parameters:', { hasImage: !!image, hasMask: !!mask, hasPrompt: !!prompt });
    return NextResponse.json(
      { error: 'Missing required parameters: image, mask, and prompt are required.' },
      { status: 400 }
    );
  }

  console.log('Processing Stability v2beta inpaint request with prompt:', prompt);

  try {
    // *** Add logging for data URL formats ***
    console.log('Image data URL (start):', image?.substring(0, 50) + (image?.length > 50 ? '...' : ''));
    console.log('Mask data URL (start):', mask?.substring(0, 50) + (mask?.length > 50 ? '...' : ''));

    // Convert data URLs to Blobs
    const imageBlob = await dataUrlToBlob(image);
    const maskBlob = await dataUrlToBlob(mask);

    // Prepare form data - RESTORING ALL optional params
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');      // REQUIRED: Source image
    formData.append('mask', maskBlob, 'mask_image.png');     // REQUIRED: B&W mask
    formData.append('prompt', prompt);                     // REQUIRED: Text prompt
    formData.append('mask_source', 'MASK_IMAGE_BLACK');  // REQUIRED: How to interpret mask
    
    // --- Optional parameters RESTORED --- 
    formData.append('output_format', 'png');
    formData.append('strength', '0.9'); // How much to deviate (Increased back to 0.9)
    formData.append('cfg_scale', '7');   // How strongly to adhere to prompt
    formData.append('samples', '1');     // Number of images
    formData.append('steps', '30');       // Number of diffusion steps
    formData.append('model', 'stable-diffusion-xl-1024-v1-0'); // Explicitly set model again

    const apiHost = 'https://api.stability.ai';
    const apiUrl = `${apiHost}/v2beta/stable-image/edit/inpaint`;

    // Log the request details
    console.log("--- Stability AI Request Details (Full Params Restored) ---");
    console.log(`Endpoint URL: ${apiUrl}`);
    console.log(`API Key Found: ${!!apiKey}`); 
    console.log("Form Data Parameters:");
    formData.forEach((value, key) => {
        if (value instanceof Blob) {
            console.log(`  ${key}: [Blob], size: ${value.size}, type: ${value.type}, filename: ${formData.get(key) instanceof File ? (formData.get(key) as File).name : 'N/A'}`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    });
    console.log("Headers:");
    console.log(`  Accept: application/json`);
    console.log(`  Authorization: Bearer [API Key Present: ${!!apiKey}]`);
    console.log("------------------------------------");

    // Make the API call
    const stabilityResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!stabilityResponse.ok) {
      console.error(`Stability AI v2beta API Error: Status ${stabilityResponse.status}`);
       let errorDetails = { message: `API Error (${stabilityResponse.status})` };
       try {
          const errorBody = await stabilityResponse.json();
          console.error('Stability AI v2beta API Error (JSON parsed):', errorBody);
           // Extract specific fields if possible (structure might differ from v1)
           // Common fields: name, message, errors[0]
           errorDetails.message = errorBody.message || errorBody.name || errorBody.errors?.[0] || JSON.stringify(errorBody);
       } catch (e) {
          try {
             const errorText = await stabilityResponse.text();
             console.error('Stability AI v2beta API Error (Text):', errorText);
             errorDetails.message = errorText.substring(0, 500) + (errorText.length > 500 ? '...' : '');
          } catch (textE) {
             console.error("Failed to read error response body.", textE);
             errorDetails.message = "Failed to read error response body.";
          }
       }
      return NextResponse.json(
        { error: 'Stability AI API request failed.', details: errorDetails },
        { status: stabilityResponse.status }
      );
    }

    // Handle successful response
    const responseJson = await stabilityResponse.json();
    
    // Log the successful response body 
    console.log("--- Stability AI Success Response Body ---");
    console.log(JSON.stringify(responseJson, null, 2));
    console.log("---------------------------------------");

    const imageBase64 = responseJson.image ?? responseJson.artifacts?.[0]?.base64; 

    if (!imageBase64) {
        console.error("Stability AI v2beta response missing image data:", responseJson);
        return NextResponse.json(
          { error: 'API processed successfully, but returned no image data.', details: responseJson },
          { status: 500 }
        );
    }

    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    console.log('Stability AI v2beta inpainting successful, returning generated image.');
    return NextResponse.json({ generatedImage: imageDataUrl });

  } catch (error) {
    console.error('Error processing Stability v2beta inpaint request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    let details: string | object = errorMessage;
    if (error instanceof Error && error.cause) {
      details = { message: errorMessage, cause: String(error.cause) };
    }
    return NextResponse.json(
      { error: 'Internal server error during Stability request.', details },
      { status: 500 }
    );
  }
} 