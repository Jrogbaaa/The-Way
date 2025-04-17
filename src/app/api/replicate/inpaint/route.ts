import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { Buffer } from 'buffer'; // Import Buffer if not already present

// Read token directly from environment
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Ensure API token is available and log prefix
if (!REPLICATE_API_TOKEN) {
  console.error('CRITICAL ERROR: REPLICATE_API_TOKEN environment variable is NOT SET.');
} else {
  // Log more details about the token for debugging
  console.log(`Replicate API Token: First 5 chars: ${REPLICATE_API_TOKEN.substring(0, 5)}..., Length: ${REPLICATE_API_TOKEN.length}`);
  console.log(`Last successful token refresh: ${new Date().toISOString()}`); // Timestamp for debugging
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
 * Handles image inpainting using the community inpainting models.
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

    // Try three different community inpainting models in order, if one fails try the next
    const inpaintingModels = [
      {
        name: "stabilityai/stable-diffusion-2-inpainting",
        version: "9c34d792f0e1f6aeda465dd5605a67196176633b557c7656f0f36c3f8ac52fc2",
        description: "Stability AI Stable Diffusion 2 Inpainting - Most reliable model"
      },
      {
        name: "runwayml/stable-diffusion-inpainting",
        version: "c28b92a7ecd66eee4aefadb71161d3c9d8d47ef9744b312183b2eb353724cd21",
        description: "RunwayML Stable Diffusion Inpainting - Community model"
      },
      {
        name: "madebyollin/sdxl-inpainting",
        version: "4e34dfb5d7332177f3f472a0b325a7e3782dd4c455d14b5b1ea2f1705c4cb77d",
        description: "SDXL Inpainting - Higher quality inpainting"
      }
    ];

    // Try each model in sequence
    for (const model of inpaintingModels) {
      console.log(`Trying inpainting model: ${model.name} (${model.description})`);
      
      try {
        // Configure appropriate input parameters based on the model
        let input;

        if (model.name.includes('sdxl')) {
          // SDXL inpainting has different parameters
          input = {
            prompt: prompt || "A beautiful bush or tree",
            image: imageDataUrl,
            mask: maskDataUrl,
            negative_prompt: "blurry, ugly, duplicate, distorted, low quality",
            width: 1024,
            height: 1024,
            num_inference_steps: 25,
            guidance_scale: 7.5,
          };
        } else {
          // Standard SD inpainting parameters
          input = {
            prompt: prompt || "A beautiful bush or tree",
            image: imageDataUrl,
            mask: maskDataUrl,
            negative_prompt: "blurry, ugly, duplicate, distorted, low quality",
            num_inference_steps: 30,
            guidance_scale: 7.5,
          };
        }

        console.log(`Attempting inpainting with model: ${model.name} (${model.description})`);
        
        // Debug info for troubleshooting
        console.log(`Inpainting parameters:
          - Prompt: "${prompt || 'A beautiful bush or tree'}"
          - Model: ${model.name} (v${model.version})
          - Image data URL length: ${imageDataUrl.length} chars
          - Mask data URL length: ${maskDataUrl.length} chars
        `);
        
        const prediction = await replicate.predictions.create({
          model: model.name,
          version: model.version,
          input: input,
        });

        console.log(`✓ Success! ${model.name} prediction initiated:`, prediction.id, prediction.status);
        return NextResponse.json({
          ...prediction,
          modelUsed: model.name
        }, { status: 201 });

      } catch (modelError: any) {
        console.error(`× Failed to use ${model.name}:`, modelError.message);
        
        // If this is the last model in our array and it failed, throw to outer catch
        if (model === inpaintingModels[inpaintingModels.length - 1]) {
          throw modelError;
        }
        
        // Otherwise continue to the next model
        console.log(`Trying next model...`);
        continue;
      }
    }

    // This should not happen as we throw from the loop, but just in case
    throw new Error("All inpainting models failed");

  } catch (error: any) {
    // Handle errors from all models
    console.error('All inpainting models failed:', error);
    
    const errorDetail = error?.response?.data?.detail || error.message || 'Unknown error';
    const statusCode = error?.response?.status || 500;
    
    // FALLBACK: If all inpainting models failed, try text-to-image as absolute last resort
    console.log("FALLBACK: All inpainting models failed. Switching to text-to-image as fallback");
    
    try {
      // Use SDXL text-to-image as fallback (known to work)
      const fallbackModel = "stability-ai/sdxl";
      const fallbackVersion = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
      
      // Create a more descriptive prompt based on original prompt
      const enhancedPrompt = prompt ? 
        `A detailed image of ${prompt}. High quality, realistic, detailed photography.` : 
        "A beautiful detailed landscape with trees and natural elements. High quality, realistic, detailed photography.";
      
      const fallbackInput = {
        prompt: enhancedPrompt,
        negative_prompt: "blurry, ugly, duplicate, distorted, low quality, cartoon, illustration, disfigured",
        num_inference_steps: 30,
        guidance_scale: 7.5,
        width: 1024,
        height: 1024,
      };
      
      console.log(`FALLBACK: Using text-to-image model with enhanced prompt: "${enhancedPrompt}"`);
      
      const fallbackPrediction = await replicate.predictions.create({
        model: fallbackModel,
        version: fallbackVersion,
        input: fallbackInput,
      });
      
      console.log(`FALLBACK prediction successfully initiated:`, fallbackPrediction.id, fallbackPrediction.status);
      
      // Return the prediction but include a flag that indicates this is a fallback
      return NextResponse.json({
        ...fallbackPrediction,
        isFallback: true,
        fallbackReason: "All inpainting models failed; used text-to-image instead"
      }, { status: 201 });
    } catch (fallbackError: any) {
      console.error("Even fallback failed:", fallbackError);
    }
    
    return NextResponse.json(
      { 
        error: `Replicate prediction creation failed after trying multiple models`,
        detail: errorDetail,
        status: statusCode
      },
      { status: statusCode }
    );
  }
} 