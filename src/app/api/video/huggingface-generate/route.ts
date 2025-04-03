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

    let imageBase64: string;

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
      
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString('base64');
    } 
    // Handle image from base64
    else {
      console.log("Processing base64 image data");
      // Remove the data:image/jpeg;base64, part
      imageBase64 = image_base64!.split(',')[1]; 
    }
    
    // Call Hugging Face API
    console.log(`Calling Hugging Face API with model: ${model_id}`);
    if (prompt) {
      console.log(`With additional prompt context: "${prompt}"`);
    }
    
    // For Stable Video Diffusion, we need to structure the request differently
    // The model expects specific parameters for image-to-video generation
    const payload = {
      inputs: imageBase64,
      parameters: {
        num_inference_steps: 25,
        num_frames: num_frames,
        fps: fps,
        motion_bucket_id: motion_bucket_id
      }
    };

    // Add prompt to payload if provided
    if (prompt && prompt.trim() !== "") {
      // @ts-ignore - Add prompt to parameters
      payload.parameters.prompt = prompt;
    }
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    // Add authorization header only if API key is available
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    console.log("Sending request to Hugging Face API...");
    
    const hfResponse = await fetch(`${API_CONFIG.huggingFaceApiUrl}/${model_id}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!hfResponse.ok) {
      let errorMessage = "Hugging Face API error";
      try {
        const errorData = await hfResponse.json();
        console.error("Error response from Hugging Face:", errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If error parsing fails, use generic error with status code
        console.error("Failed to parse error response:", e);
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
