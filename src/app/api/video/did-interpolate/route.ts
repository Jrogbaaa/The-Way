import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";

interface KeyframeRequest {
  source_images: string[];
  frame_rate?: number;
  transition_type?: string;
  keyframe_duration?: number;
  quality?: string;
  resolution?: string;
}

/**
 * API route for video interpolation using D-ID
 * This serves as a fallback when Runway interpolation fails
 */
export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!API_CONFIG.dIdApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "D-ID API key is not configured. Please add D_ID_API_KEY to your environment variables." 
        },
        { status: 500 }
      );
    }

    const body = await req.json() as KeyframeRequest;
    const { source_images, frame_rate, transition_type, keyframe_duration, quality, resolution } = body;

    // Validate input
    if (!source_images || source_images.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 source images are required" },
        { status: 400 }
      );
    }

    // Format the request for D-ID's API
    const didRequestBody = {
      source_images,
      frame_rate: frame_rate || 30,
      transition_type: transition_type || "morph",
      keyframe_duration: keyframe_duration || 2,
      output: {
        format: "mp4",
        quality: quality || "standard",
        resolution: resolution || "1080p"
      }
    };

    // Call D-ID's API
    console.log("Calling D-ID API for video interpolation...");
    const didResponse = await fetch(`${API_CONFIG.dIdApiUrl}/animations/interpolations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_CONFIG.dIdApiKey}`
      },
      body: JSON.stringify(didRequestBody)
    });

    if (!didResponse.ok) {
      const errorData = await didResponse.json().catch(() => ({ error: "Unknown error" }));
      console.error("D-ID API error:", errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: `D-ID API error: ${errorData.error || didResponse.statusText}`,
          status: didResponse.status
        },
        { status: didResponse.status }
      );
    }

    const didData = await didResponse.json();
    
    // Return the video URL from D-ID
    return NextResponse.json({
      success: true,
      videoUrl: didData.result_url,
      metadata: {
        frame_rate,
        transition_type,
        keyframe_duration,
        quality,
        resolution,
        provider: "d-id"
      }
    });
  } catch (error) {
    console.error("Error in D-ID interpolation:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process video with D-ID" 
      },
      { status: 500 }
    );
  }
}
