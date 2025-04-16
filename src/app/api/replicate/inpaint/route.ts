import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { Buffer } from 'buffer'; // Import Buffer if not already present

// Read token directly from environment
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Ensure API token is available and log prefix
if (!REPLICATE_API_TOKEN) {
  console.error('CRITICAL ERROR: REPLICATE_API_TOKEN environment variable is NOT SET.');
} else {
  console.log(`Using Replicate API Token starting with: ${REPLICATE_API_TOKEN.substring(0, 5)}...`);
}

// Initialize Replicate client once at the module level
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN, // Use token directly from process.env
});

// Helper function to convert File/Blob to data URL
async function imageToDataUrl(file: File | Blob): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'image/png'; // Default to png if type is missing
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * API Route: POST /api/replicate/inpaint
 * Handles image inpainting and generative fill requests using the Replicate API.
 * 
 * Workflow:
 * 1. Receives image, mask (optional), prompt (optional), width, and height from FormData.
 * 2. Converts image and mask files to data URLs.
 * 3. Specifies the Replicate model (`black-forest-labs/flux-fill-dev`).
 * 4. Sets input parameters, including `image`, `mask`, `prompt`, `guidance_scale`, and `strength`.
 * 5. Calls `replicate.predictions.create()` to start the asynchronous generation process.
 * 6. Returns the initial prediction object (including its ID) to the client for polling.
 */
export async function POST(req: NextRequest) {
  console.log('Received request for /api/replicate/inpaint POST');

  // Token check 
  if (!REPLICATE_API_TOKEN) {
    // This redundant check ensures we don't proceed if the initial log showed it missing.
    return NextResponse.json({ error: 'Server configuration error: Replicate API token missing' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const maskFile = formData.get('mask') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const widthStr = formData.get('width') as string | null;
    const heightStr = formData.get('height') as string | null;

    // Refined Validation
    if (!imageFile || !maskFile || !widthStr || !heightStr || isNaN(parseInt(widthStr)) || isNaN(parseInt(heightStr))) {
        console.error('Missing or invalid input:', { 
            imageFile: !!imageFile, 
            maskFile: !!maskFile, 
            widthStr, 
            heightStr, 
            prompt: prompt || '[Empty]' 
        });
        // Combine error messages for clarity
        let errorMessages = [];
        if (!imageFile) errorMessages.push('Original image file is required.');
        if (!maskFile) errorMessages.push('Mask image file is required.');
        if (!widthStr || isNaN(parseInt(widthStr))) errorMessages.push('Valid width is required.');
        if (!heightStr || isNaN(parseInt(heightStr))) errorMessages.push('Valid height is required.');
        
        return NextResponse.json({ error: errorMessages.join(' ') }, { status: 400 });
    }
    const width = parseInt(widthStr);
    const height = parseInt(heightStr);
    
    console.log(`Processing inpaint: Prompt - "${prompt || '[Empty Prompt]'}", Size: ${width}x${height}`);

    const imageDataUrl = await imageToDataUrl(imageFile);
    const maskDataUrl = await imageToDataUrl(maskFile);

    // --- Use the new model --- 
    const modelIdentifier = "black-forest-labs/flux-fill-dev"; 
    
    const input = {
        image: imageDataUrl, 
        mask: maskDataUrl, 
        prompt: prompt || "",
        // --- Add common inpainting parameters --- 
        guidance_scale: 7.5, // How strongly to follow the prompt (default often around 7.5)
        strength: 0.85,      // How much to respect the original image vs prompt (0=prompt only, 1=image only). Higher values are typical for inpainting.
    };

    console.log(`Attempting replicate.predictions.create with MODEL: ${modelIdentifier}`);
    console.log(`Input keys being sent: ${Object.keys(input).join(', ')}`);
    console.log(`Input values (excluding image data):`, { 
        prompt: input.prompt, 
        guidance_scale: input.guidance_scale, 
        strength: input.strength 
    });

    try {
        // --- Revert to predictions.create for non-blocking behavior --- 
        const prediction = await replicate.predictions.create({
            model: modelIdentifier, // Use owner/name, let Replicate handle version
            // version: undefined, // Explicitly omit version hash
            input: input,
            webhook: undefined, 
            webhook_events_filter: undefined,
        });

        console.log(`Replicate prediction successfully initiated for ${modelIdentifier}:`, prediction.id, prediction.status);
        // Return the initial prediction object for the frontend to poll
        return NextResponse.json(prediction, { status: 201 }); 

    } catch (creationError: any) {
       // Refined Error Logging
       console.error(`Error during replicate.predictions.create for ${modelIdentifier}:`, creationError);
       const responseData = creationError?.response?.data; 
       const errorTitle = responseData?.title || 'Prediction Creation Failed';
       const errorDetail = responseData?.detail || creationError.message || 'Unknown error detail';
       const statusCode = creationError?.response?.status || 500;
       
       console.error(`Prediction creation failed! Status: ${statusCode}, Title: "${errorTitle}", Detail: "${errorDetail}"`);
       
       // Keep the specific check for 422 errors, but update the message context
       if (statusCode === 422 && (errorTitle.includes("Invalid version") || errorDetail.includes("not permitted") || errorDetail.includes("does not exist"))) {
            console.error(`PERSISTENT 422 ERROR: Please VERIFY on replicate.com that your token has permissions for ${modelIdentifier} OR try specifying a known working version hash if available.`);
       }
      return NextResponse.json(
          { 
              error: `Replicate prediction creation failed: ${errorTitle}`, 
              detail: errorDetail, 
              status: statusCode 
          },
          { status: statusCode }
      );
    }

  } catch (error: any) {
    // Outer catch for formData parsing or other initial errors
    console.error('Unhandled error in /api/replicate/inpaint POST:', error);
    return NextResponse.json(
      { error: 'Failed to process inpaint request', detail: error.message },
      { status: 500 } 
    );
  }
} 