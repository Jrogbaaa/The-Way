import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";

interface KeyframeInput {
  image_url: string;
  frame_position: number;
}

/**
 * API route for video interpolation using Runway Gen-2
 */
export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!API_CONFIG.runwayApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Runway API key is not configured. Please add RUNWAY_API_KEY to your environment variables." 
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { keyframes, interpolation_factor, output_format, quality, resolution } = body;

    // Validate input
    if (!keyframes || keyframes.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 keyframes are required" },
        { status: 400 }
      );
    }

    // Format the request for Runway's API
    const runwayRequestBody = {
      images: keyframes.map((kf: {image_url: string, frame_position: number}) => ({ 
        image_url: kf.image_url,
        frame_position: kf.frame_position
      })),
      interpolation_factor: interpolation_factor || 60, // Default: 60 frames
      output_format: output_format || "mp4",
      output_quality: quality || "standard",
      resolution: resolution || "1080p"
    };

    // Call Runway's API
    console.log("Calling Runway API for video interpolation...");
    const runwayResponse = await fetch(`${API_CONFIG.runwayApiUrl}/interpolations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_CONFIG.runwayApiKey}`
      },
      body: JSON.stringify(runwayRequestBody)
    });

    if (!runwayResponse.ok) {
      const errorData = await runwayResponse.json().catch(() => ({ error: "Unknown error" }));
      console.error("Runway API error:", errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Runway API error: ${errorData.error || runwayResponse.statusText}`,
          status: runwayResponse.status
        },
        { status: runwayResponse.status }
      );
    }

    const runwayData = await runwayResponse.json();
    
    // Return the video URL from Runway
    return NextResponse.json({
      success: true,
      videoUrl: runwayData.video_url,
      metadata: {
        interpolation_factor,
        output_format,
        quality,
        resolution,
        provider: "runway"
      }
    });
  } catch (error) {
    console.error("Error in Runway interpolation:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process video with Runway" 
      },
      { status: 500 }
    );
  }
}
