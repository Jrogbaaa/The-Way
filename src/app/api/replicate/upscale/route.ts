import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { Buffer } from 'buffer';

// Read token directly from environment
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Ensure API token is available and log prefix
if (!REPLICATE_API_TOKEN) {
  console.error('CRITICAL ERROR: REPLICATE_API_TOKEN environment variable is NOT SET.');
}

// Initialize Replicate client once at the module level
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Helper function to convert File/Blob to data URL
async function imageToDataUrl(file: File | Blob): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'image/png'; // Default to png if type is missing
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * API Route: POST /api/replicate/upscale
 * Handles image upscaling using Replicate's upscaling models.
 */
export async function POST(req: NextRequest) {
  console.log('Received request for /api/replicate/upscale POST');

  // Token check 
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Server configuration error: Replicate API token missing' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    
    // Validation
    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    console.log(`Processing upscale for image: ${imageFile.name}`);

    const imageDataUrl = await imageToDataUrl(imageFile);
    
    // Updated upscaling models with current versions
    const upscaleModels = [
      {
        name: "nightmareai/real-esrgan",
        version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        description: "Real-ESRGAN upscaler - general purpose",
        scale: 2
      },
      {
        name: "tencentarc/gfpgan",
        version: "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
        description: "GFPGAN face restoration",
        scale: 2
      },
      {
        name: "nightmareai/upscale-plus",
        version: "f9f9be8c59d606761c6eeaedf1b2e07f5c9fea8289cac15b85dc69abdae6f5e8",
        description: "Upscale Plus - high quality upscaler",
        scale: 4
      }
    ];

    // Try each model in sequence
    for (const model of upscaleModels) {
      console.log(`Trying upscaling model: ${model.name} (${model.description})`);
      
      try {
        // Configure appropriate input parameters based on the model
        let input: any = {
          image: imageDataUrl,
        };
        
        // Model-specific parameter adjustments
        if (model.name === "nightmareai/real-esrgan") {
          input.scale = model.scale;
          input.face_enhance = true;
        } else if (model.name === "tencentarc/gfpgan") {
          input.version = "v1.4";
          input.scale = model.scale;
        } else if (model.name === "nightmareai/upscale-plus") {
          input.scale = model.scale;
        }

        console.log(`Attempting upscaling with model: ${model.name} (${model.description})`);
        
        // Debug info for troubleshooting
        console.log(`Upscaling parameters:
          - Model: ${model.name} (v${model.version})
          - Scale: ${model.scale}x
          - Image data URL length: ${imageDataUrl.length} chars
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
        if (model === upscaleModels[upscaleModels.length - 1]) {
          throw modelError;
        }
        
        // Otherwise continue to the next model
        console.log(`Trying next model...`);
        continue;
      }
    }

    // This should not happen as we throw from the loop, but just in case
    throw new Error("All upscaling models failed");

  } catch (error: any) {
    // Handle errors from all models
    console.error('All upscaling models failed:', error);
    
    const errorDetail = error?.response?.data?.detail || error.message || 'Unknown error';
    const statusCode = error?.response?.status || 500;
    
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