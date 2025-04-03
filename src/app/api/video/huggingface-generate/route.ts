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
    
    // Construct headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    // Add authorization header only if API key is available
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    // Create the API URL - using the direct inference endpoint
    const apiUrl = `https://api-inference.huggingface.co/models/${model_id}`;
    
    console.log("Sending request to Hugging Face API...");
    
    // Create a simple payload - for this model, we just need to send the image with Content-Type: application/json
    // The model-specific parameters are included in the body
    const payload = {
      inputs: imageBase64,
      parameters: {
        motion_bucket_id: motion_bucket_id,
        fps: fps,
        num_frames: num_frames,
      }
    };
    
    // Add prompt to the parameters if provided
    if (prompt && prompt.trim()) {
      // @ts-ignore
      payload.parameters.prompt = prompt.trim();
    }
    
    // Call the Hugging Face API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      let errorMessage = `Hugging Face API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("Error response from Hugging Face:", errorData);
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      
      console.error("Hugging Face API error:", errorMessage);
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          status: response.status
        },
        { status: response.status }
      );
    }
    
    // Get the response as an array buffer (binary data)
    const videoBuffer = await response.arrayBuffer();
    
    // Convert the video to base64 for sending to the client
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;
    
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
