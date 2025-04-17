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
        name: "sczhou/codeformer",
        version: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
        description: "CodeFormer upscaler - good for faces",
        scale: 2
      },
      {
        name: "jingyunliang/swinir",
        version: "660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a",
        description: "SwinIR upscaler - high quality but slower",
        scale: 4
      }
    ];

    // Try each model in sequence
    for (const model of upscaleModels) {
      console.log(`Trying upscale model: ${model.name} (${model.description})`);
      
      try {
        // Configure input parameters based on the model
        let input = {
          image: imageDataUrl,
          scale: model.scale
        };

        if (model.name === "sczhou/codeformer") {
          // CodeFormer has extra parameters for face restoration
          Object.assign(input, {
            codeformer_fidelity: 0.7, // Balance between quality and fidelity
            face_upsample: true,      // Enhance faces specifically
            background_enhance: true  // Also enhance non-face regions
          });
        }
        
        console.log(`Attempting upscaling with model: ${model.name}`);
        
        const prediction = await replicate.predictions.create({
          model: model.name,
          version: model.version,
          input: input,
        });

        console.log(`✓ Success! ${model.name} prediction initiated:`, prediction.id);
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
        console.log(`Trying next upscale model...`);
        continue;
      }
    }

    // This should not happen as we throw from the loop, but just in case
    throw new Error("All upscaling models failed");

  } catch (error: any) {
    console.error('All upscaling models failed:', error);
    
    const errorDetail = error?.response?.data?.detail || error.message || 'Unknown error';
    const statusCode = error?.response?.status || 500;
    
    return NextResponse.json(
      { 
        error: `Replicate upscale prediction creation failed after trying multiple models`,
        detail: errorDetail 
      },
      { status: statusCode }
    );
  }
} 