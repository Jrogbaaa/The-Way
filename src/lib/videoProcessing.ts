import { KeyframeData, VideoOptions } from "@/types/storyboard";

/**
 * Process a storyboard of keyframes into a coherent video
 * using AI video interpolation for smooth transitions
 */
export async function processStoryboardToVideo(
  keyframes: KeyframeData[],
  options: VideoOptions
): Promise<string> {
  // Validate input
  if (keyframes.length < 2) {
    throw new Error("At least 2 keyframes are required to generate a video");
  }
  
  // Sort keyframes by timestamp
  const sortedKeyframes = [...keyframes].sort((a, b) => a.timestamp - b.timestamp);
  
  // Validate keyframe spacing (should be ~2 seconds apart)
  for (let i = 1; i < sortedKeyframes.length; i++) {
    const timeDiff = sortedKeyframes[i].timestamp - sortedKeyframes[i-1].timestamp;
    if (Math.abs(timeDiff - 2) > 0.5) {
      console.warn(`Keyframes at ${sortedKeyframes[i-1].timestamp}s and ${sortedKeyframes[i].timestamp}s are not ~2 seconds apart (${timeDiff}s)`);
    }
  }
  
  try {
    // Process with one of the available video interpolation APIs
    return await runwayInterpolation(sortedKeyframes, options);
  } catch (error) {
    console.error("Error with primary video generation service:", error);
    
    // Fallback to alternative service
    try {
      return await didVideoInterpolation(sortedKeyframes, options);
    } catch (fallbackError) {
      console.error("Error with fallback video generation service:", fallbackError);
      throw new Error("All video generation services failed");
    }
  }
}

/**
 * Generate video using Runway Gen-2 API
 */
async function runwayInterpolation(
  keyframes: KeyframeData[],
  options: VideoOptions
): Promise<string> {
  const response = await fetch("/api/video/runway-interpolate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyframes: keyframes.map((kf, i) => ({
        image_url: kf.imageUrl,
        frame_position: kf.timestamp
      })),
      interpolation_factor: options.fps * 2, // 2-second intervals × fps
      output_format: "mp4",
      quality: options.quality,
      resolution: options.resolution
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Runway interpolation failed: ${error.message || error.error || response.status}`);
  }
  
  const result = await response.json();
  return result.videoUrl;
}

/**
 * Generate video using D-ID API as a fallback
 */
async function didVideoInterpolation(
  keyframes: KeyframeData[],
  options: VideoOptions
): Promise<string> {
  const response = await fetch("/api/video/did-interpolate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_images: keyframes.map(kf => kf.imageUrl),
      frame_rate: options.fps,
      transition_type: "morph",
      keyframe_duration: 2,
      quality: options.quality,
      resolution: options.resolution
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`D-ID interpolation failed: ${error.message || error.error || response.status}`);
  }
  
  const result = await response.json();
  return result.videoUrl;
}

/**
 * Apply post-processing to a generated video
 * (optional enhancements like audio, transitions, etc.)
 */
export async function postProcessVideo(
  videoUrl: string,
  options: {
    addAudio?: string;
    addIntro?: boolean;
    addOutro?: boolean;
    enhanceQuality?: boolean;
  }
): Promise<string> {
  const response = await fetch("/api/video/post-process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoUrl,
      ...options
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Video post-processing failed: ${error.message || error.error || response.status}`);
  }
  
  const result = await response.json();
  return result.processedVideoUrl;
}

/**
 * Extract a thumbnail from a video at a specific timestamp
 */
export async function extractVideoThumbnail(
  videoUrl: string,
  timestamp: number = 0
): Promise<string> {
  const response = await fetch("/api/video/extract-thumbnail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoUrl,
      timestamp
    })
  });
  
  if (!response.ok) {
    throw new Error(`Thumbnail extraction failed: ${response.status}`);
  }
  
  const result = await response.json();
  return result.thumbnailUrl;
} 