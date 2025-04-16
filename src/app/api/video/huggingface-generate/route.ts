import { NextRequest, NextResponse } from "next/server";
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Use environment variable directly
});

const isConfigured = !!process.env.REPLICATE_API_TOKEN;

interface VideoGenerationRequest {
  imageDataURL: string;
  num_frames?: number;
  fps?: number;
  motion_bucket_id?: number;
  prompt?: string;
}

/**
 * API route for generating videos from images using Hugging Face models
 * This provides a free alternative to Runway or D-ID
 */
export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: 'Server configuration error: Replicate API token missing' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json() as VideoGenerationRequest;
    const { 
      imageDataURL,
      num_frames = 25, 
      fps = 7, 
      motion_bucket_id = 127,
      prompt = "" // Default to empty string
    } = body;

    if (!imageDataURL) {
      return NextResponse.json(
        { success: false, error: "imageDataURL is required" },
        { status: 400 }
      );
    }

    // Extract base64 data
    const base64Data = imageDataURL.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "Invalid imageDataURL format" },
        { status: 400 }
      );
    }

    // Call the Replicate API to generate video
    const output = await replicate.run(
      'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
      {
        input: {
          image: `data:image/jpeg;base64,${base64Data}`,
          num_frames,
          fps,
          motion_bucket_id,
          ...(prompt && { prompt: prompt })
        }
      }
    );

    // Return the generated video URL or data
    return NextResponse.json(output, { status: 200 });
  } catch (error: any) {
    console.error('Error calling Hugging Face video generation API:', error);
    // Handle potential errors from the Replicate API
    const errorMessage = error.response?.data?.detail || 'Failed to generate video';
    const statusCode = error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
