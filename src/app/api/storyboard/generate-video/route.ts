import { NextRequest, NextResponse } from "next/server";
import { processStoryboardToVideo } from "@/lib/videoProcessing";
import { KeyframeData, VideoOptions } from "@/types/storyboard";

interface RequestBody {
  keyframes: KeyframeData[];
  options: VideoOptions;
}

/**
 * API route for generating a video from a series of keyframes
 * using AI-powered frame interpolation
 */
export async function POST(req: NextRequest) {
  try {
    const { keyframes, options } = await req.json() as RequestBody;
    
    // Validate input
    if (!keyframes || keyframes.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 keyframes are required" },
        { status: 400 }
      );
    }
    
    // Process default options
    const videoOptions: VideoOptions = {
      fps: options?.fps || 30,
      resolution: options?.resolution || "1080p",
      quality: options?.quality || "standard",
      music: options?.music,
      transitionStyle: options?.transitionStyle
    };
    
    // Process the storyboard into a video
    const videoUrl = await processStoryboardToVideo(keyframes, videoOptions);
    
    // Return the video URL
    return NextResponse.json({
      success: true,
      videoUrl,
      duration: calculateVideoDuration(keyframes),
      keyframeCount: keyframes.length
    });
  } catch (error) {
    console.error("Video generation error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate video" 
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate the approximate duration of the video based on keyframes
 */
function calculateVideoDuration(keyframes: KeyframeData[]): number {
  if (keyframes.length === 0) return 0;
  
  // Find the last keyframe timestamp and add 2 seconds (assuming each keyframe represents ~2 seconds)
  const sortedKeyframes = [...keyframes].sort((a, b) => a.timestamp - b.timestamp);
  return sortedKeyframes[sortedKeyframes.length - 1].timestamp + 2;
} 