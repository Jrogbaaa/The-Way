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
    const apiKey = API_CONFIG.huggingFaceApiKey || "";
    
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

    let base64Data: string;

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
      base64Data = Buffer.from(imageBuffer).toString('base64');
    } 
    // Handle image from base64
    else {
      console.log("Processing base64 image data");
      // Remove the data:image/jpeg;base64, part
      base64Data = image_base64!.split(',')[1]; 
    }

    // Instead of using the main Hugging Face API, we'll use Replicate API which works better
    // for this specific model
    const replicateApiKey = API_CONFIG.replicateApiToken;
    
    if (!replicateApiKey) {
      return NextResponse.json(
        { success: false, error: "Replicate API key is required but missing" },
        { status: 400 }
      );
    }
    
    console.log("Using Replicate API for Stable Video Diffusion");
    
    // Call the Replicate API with the model
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${replicateApiKey}`
      },
      body: JSON.stringify({
        version: "6244f70a6b0dfd1bb6984a53f9dfedb15142234597b12481be5b0d8ce979c138",
        input: {
          image: `data:image/jpeg;base64,${base64Data}`,
          motion_bucket_id: motion_bucket_id,
          fps: fps,
          ...(prompt && { prompt: prompt })
        }
      })
    });
    
    if (!replicateResponse.ok) {
      let errorMessage = `Replicate API error: ${replicateResponse.status} ${replicateResponse.statusText}`;
      try {
        const errorData = await replicateResponse.json();
        console.error("Error response from Replicate:", errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          status: replicateResponse.status
        },
        { status: replicateResponse.status }
      );
    }
    
    const prediction = await replicateResponse.json();
    
    // Replicate returns a prediction ID and we need to poll for the result
    let videoUrl: string | null = null;
    const predictionId = prediction.id;
    
    // Poll for the result (up to 60 seconds)
    for (let i = 0; i < 30; i++) {
      console.log(`Polling for prediction result, attempt ${i+1}...`);
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${replicateApiKey}`
        }
      });
      
      if (!statusResponse.ok) {
        console.error("Failed to check prediction status:", statusResponse.statusText);
        continue;
      }
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === "succeeded") {
        videoUrl = statusData.output;
        break;
      } else if (statusData.status === "failed") {
        return NextResponse.json(
          { success: false, error: statusData.error || "Video generation failed" },
          { status: 500 }
        );
      }
      
      // Wait 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Timed out waiting for video generation" },
        { status: 504 }
      );
    }
    
    // We now have a video URL from Replicate, but we need to return a data URL
    // to the client, so we need to fetch the video data and convert it
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch generated video" },
        { status: 500 }
      );
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;
    
    return NextResponse.json({
      success: true,
      videoUrl: videoDataUrl,
      metadata: {
        model_id: "replicate/stable-video-diffusion",
        num_frames,
        fps,
        motion_bucket_id,
        has_prompt: !!prompt,
        provider: "replicate"
      }
    });
  } catch (error) {
    console.error("Error in video generation:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate video" 
      },
      { status: 500 }
    );
  }
}
