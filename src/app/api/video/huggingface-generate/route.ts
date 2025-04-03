import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";

interface VideoGenerationRequest {
  image_url?: string;
  image_base64?: string;
  num_frames?: number;
  fps?: number;
  motion_bucket_id?: number;
  model_id?: string;
  prompt?: string;
}

/**
 * API route for generating videos from images using Hugging Face models
 * This provides a free alternative to Runway or D-ID
 */
export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured - but allow operation without key
    const apiKey = API_CONFIG.huggingFaceApiKey;
    
    const body = await req.json() as VideoGenerationRequest;
    const { 
      image_url, 
      image_base64,
      num_frames = 25, 
      fps = 7, 
      motion_bucket_id = 127,
      model_id = API_CONFIG.videoGenerationModels.stableVideoDiffusion,
      prompt = "" // Default to empty string
    } = body;

    // Validate input
    if (!image_url && !image_base64) {
      return NextResponse.json(
        { success: false, error: "An image URL or base64 data is required" },
        { status: 400 }
      );
    }

    let imageBuffer: ArrayBuffer;

    // Handle image from URL
    if (image_url) {
      console.log("Fetching image data from URL:", image_url);
      const imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch image from provided URL" },
          { status: 400 }
        );
      }
      
      imageBuffer = await imageResponse.arrayBuffer();
    } 
    // Handle image from base64
    else {
      console.log("Processing base64 image data");
      const base64Data = image_base64!.split(',')[1]; // Remove the data:image/jpeg;base64, part
      imageBuffer = new Uint8Array(Buffer.from(base64Data, 'base64')).buffer;
    }
    
    // Call Hugging Face API
    console.log(`Calling Hugging Face API with model: ${model_id}`);
    if (prompt) {
      console.log(`With additional prompt context: "${prompt}"`);
    }
    
    const payload = {
      inputs: {
        image: Buffer.from(imageBuffer).toString('base64'),
        num_frames,
        fps,
        motion_bucket_id
      }
    };

    // Add prompt to payload context if provided
    if (prompt) {
      // @ts-ignore - Add prompt to payload
      payload.inputs.prompt = prompt;
    }
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    // Add authorization header only if API key is available
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    const hfResponse = await fetch(`${API_CONFIG.huggingFaceApiUrl}/${model_id}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!hfResponse.ok) {
      let errorMessage = "Hugging Face API error";
      try {
        const errorData = await hfResponse.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If error parsing fails, use generic error with status code
        errorMessage = `${errorMessage}: ${hfResponse.status} ${hfResponse.statusText}`;
      }
      
      console.error("Hugging Face API error:", errorMessage);
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          status: hfResponse.status
        },
        { status: hfResponse.status }
      );
    }

    // Get response which should be the video data
    const videoBuffer = await hfResponse.arrayBuffer();
    
    // Convert to base64 for the response
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;
    
    // Return the video URL
    return NextResponse.json({
      success: true,
      videoUrl: videoDataUrl,
      metadata: {
        model_id,
        num_frames,
        fps,
        motion_bucket_id,
        has_prompt: !!prompt,
        provider: "huggingface"
      }
    });
  } catch (error) {
    console.error("Error in Hugging Face video generation:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate video with Hugging Face" 
      },
      { status: 500 }
    );
  }
}
