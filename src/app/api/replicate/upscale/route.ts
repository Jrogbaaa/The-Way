import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to convert file to data buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

// Helper function to convert buffer to data URI
function bufferToDataURI(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  console.log('Received request for /api/replicate/upscale POST');

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN not set');
    return NextResponse.json({ error: 'Server configuration error: Replicate API token is missing.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    console.log('Image file received:', imageFile.name, imageFile.size, imageFile.type);

    // Convert the image file to a data URI for Replicate input
    const imageBuffer = await fileToBuffer(imageFile);
    const imageDataURI = bufferToDataURI(imageBuffer, imageFile.type);

    console.log('Running Replicate upscale model...');

    const modelId = 'batouresearch/high-resolution-controlnet-tile:latest';
    const input = {
        image: imageDataURI,
        // --- Optional parameters for the model (adjust as needed) ---
        // prompt: "high quality photo", // Optional: Guide the upscaler
        // negative_prompt: "low quality, blurry, text, watermark", // Optional
        // hdr: 0.2, // Adjust High Dynamic Range effect (0 to 1)
        // steps: 20, // Number of denoising steps
        // scheduler: "DDIM", // Denoising scheduler
        // creativity: 0.6, // How much creative liberty the model takes (0 to 1)
        // guess_mode: false, // If true, ControlNet ignores prompt
        resolution: 2048, // Target resolution (e.g., 2048, 2560) - check model limits
        // resemblance: 0.4, // How closely the output resembles the input (0 to 1)
        // guidance_scale: 5, // Scale for guidance loss (higher means stricter prompt adherence)
        // ----------------------------------------------------------
    };

    // Start the prediction
    const prediction = await replicate.predictions.create({
      version: modelId.split(':').pop()!, // Extract version hash
      model: modelId.split(':')[0],     // Extract model name
      input: input,
      // webhook: `${process.env.VERCEL_URL}/api/webhooks/replicate` // Optional: Setup webhook for completion notification
      // webhook_events_filter: ["completed"]
    });

    console.log('Replicate prediction started:', prediction.id, prediction.status);

    // Immediately return the prediction object so the frontend can start polling
    return NextResponse.json(prediction, { status: 201 });

  } catch (error: any) {
    console.error('Error calling Replicate API:', error.message);
    // Try to parse Replicate's error details if available
    const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 