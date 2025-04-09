import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { formatErrorMessage } from '@/lib/errorHandling';
import { API_CONFIG } from '@/lib/config';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || API_CONFIG.replicateApiToken,
});

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { prompt, negative_prompt, num_outputs = 1 } = body;

    // Check if prompt is provided
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Prefix with BEA to ensure the model generates with the correct character
    const processedPrompt = `BEA ${prompt}`;
    
    // Set up parameters for the Bea generator model
    const input = {
      prompt: processedPrompt,
      negative_prompt: negative_prompt || "male, man, masculine, boy, male features, beard, mustache",
      model: "dev",
      num_outputs: Number(num_outputs),
      lora_scale: 1,
      megapixels: "1",
      aspect_ratio: "1:1",
      output_format: "webp",
      guidance_scale: 3,
      output_quality: 80,
      prompt_strength: 0.8,
      num_inference_steps: 28
    };

    console.log('Running Bea model with parameters:', input);

    // Run the model with the specified input parameters
    const output = await replicate.run(
      "jrogbaaa/beagenerator:16f9ef38ac2f6644b738abf98d13a2cef25gD40a6ae5b8d8e3e99a941e1a39bf",
      { input }
    );

    // Return the output
    return NextResponse.json({ output });
    
  } catch (error) {
    console.error('Error running Bea model:', error);
    const errorMessage = formatErrorMessage(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 