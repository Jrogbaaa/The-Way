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
 * Handles image inpainting using the zsxkib/flux-dev-inpainting model.
 * 
 * Workflow:
 * 1. Receives image, mask, and prompt from FormData
 * 2. Converts image and mask files to data URLs
 * 3. Configures inpainting parameters for optimal results
 * 4. Calls Replicate API to perform inpainting
 * 5. Returns prediction object for polling
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

    // Validation
    if (!imageFile || !maskFile) {
      console.error('Missing input:', { 
        imageFile: !!imageFile, 
        maskFile: !!maskFile,
        prompt: prompt || '[Empty]' 
      });
      
      let errorMessages = [];
      if (!imageFile) errorMessages.push('Original image file is required.');
      if (!maskFile) errorMessages.push('Mask image file is required.');
      
      return NextResponse.json({ error: errorMessages.join(' ') }, { status: 400 });
    }

    console.log(`Processing inpaint with prompt: "${prompt || '[Empty Prompt]'}"`);

    const imageDataUrl = await imageToDataUrl(imageFile);
    const maskDataUrl = await imageToDataUrl(maskFile);

    // --- Switched to SDXL Inpainting Model ---
    const modelIdentifier = "stability-ai/sdxl-inpainting:1a4128c86c222449267578b3e285664185b00f46396ad131617ec556b8f1e8b3"; 
    
    // Extract version and model name correctly for the predictions.create call
    const [modelOwnerSlashName, modelVersion] = modelIdentifier.split(':');
    
    const input = {
      image: imageDataUrl,
      mask: maskDataUrl,
      prompt: prompt || "", // Provide empty prompt if null
      negative_prompt: "mountains, clouds, sky, rocks, blurry, duplicate", // Keep negative prompt
      // Common parameters for SDXL
      num_inference_steps: 30, 
      guidance_scale: 7.5,     
      // scheduler: "K_EULER", // Let SDXL use its default scheduler
      // inpainting_full_res_padding: 16, // Removed, less common for SDXL
      // strength might not be applicable or named differently
      // num_outputs: 1, // Default is usually 1
    };

    console.log(`Attempting replicate.predictions.create with MODEL: ${modelOwnerSlashName} VERSION: ${modelVersion}`);
    console.log(`Input configuration:`, { 
      prompt: input.prompt,
      negative_prompt: input.negative_prompt, 
      num_inference_steps: input.num_inference_steps,
      guidance_scale: input.guidance_scale,
      // scheduler: input.scheduler, 
      // inpainting_full_res_padding: input.inpainting_full_res_padding,
    });

    try {
      const prediction = await replicate.predictions.create({
        // Pass model and version separately
        model: modelOwnerSlashName,
        version: modelVersion,
        input: input,
      });

      console.log(`Replicate prediction successfully initiated:`, prediction.id, prediction.status);
      return NextResponse.json(prediction, { status: 201 });

    } catch (creationError: any) {
      console.error(`Error during replicate.predictions.create:`, creationError);
      
      const responseData = creationError?.response?.data;
      const errorTitle = responseData?.title || 'Prediction Creation Failed';
      const errorDetail = responseData?.detail || creationError.message || 'Unknown error detail';
      const statusCode = creationError?.response?.status || 500;
      
      console.error(`Prediction creation failed! Status: ${statusCode}, Title: "${errorTitle}", Detail: "${errorDetail}"`);
      
      // Special handling for common 422 errors
      if (statusCode === 422) {
        if (errorDetail.includes("not permitted") || errorDetail.includes("does not exist")) {
          console.error(`Permission Error: Please verify your Replicate API token has access to ${modelIdentifier}`);
          return NextResponse.json(
            { 
              error: 'Permission denied',
              detail: 'Your API token does not have permission to use this model. Please check your Replicate account settings.',
              status: 422
            },
            { status: 422 }
          );
        }
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