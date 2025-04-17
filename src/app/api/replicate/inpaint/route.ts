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

    // Updated inpainting models with current versions
    const inpaintingModels = [
      {
        name: "stability-ai/sdxl-inpainting",
        version: "a62d8f6f9fb5aeab6582b6e0d9f692c8210937b5cf77a308528e3e72ed049177", 
        description: "Latest SDXL Inpainting model from Stability AI"
      },
      {
        name: "stability-ai/stable-diffusion-xl-base-1.0",
        version: "b739fc042e8a19504d4f422aa118c8b32e996f143ad9b2537494905ccc8ff29f",
        description: "Stability AI SDXL base model with inpainting capability"
      },
      {
        name: "fofr/sdxl-inpainting-fallback",
        version: "c51ee1c8bec94f687eb2ce4998602139bfb590f960b9cf512862bbb12a0c9cc6",
        description: "Community SDXL inpainting fallback model"
      }
    ];

    // Try each model in sequence
    for (const model of inpaintingModels) {
      console.log(`Trying inpainting model: ${model.name} (${model.description})`);
      
      try {
        // Configure appropriate input parameters based on the model
        let input;
        
        // All models now have similar parameters (all are SDXL-based)
        input = {
          prompt: prompt || "A beautiful bush or tree",
          image: imageDataUrl,
          mask: maskDataUrl,
          negative_prompt: "blurry, ugly, duplicate, distorted, low quality, out of frame",
          guidance_scale: 7.5,
          num_inference_steps: 25,
          scheduler: "K_EULER_ANCESTRAL",
        };

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
      // Get the prompt from earlier scope to fix the reference error
      const formData = await req.formData();
      const savedPrompt = formData.get('prompt') as string | null;
      
      // Use SDXL text-to-image as fallback (known to work)
      const fallbackModel = "stability-ai/sdxl";
      const fallbackVersion = "a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5";
      
      // Create a more descriptive prompt based on original prompt
      const enhancedPrompt = savedPrompt ? 
        `A detailed image of ${savedPrompt}. High quality, realistic, detailed photography.` : 
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