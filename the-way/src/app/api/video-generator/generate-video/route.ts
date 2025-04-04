import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GeneratedFrame } from '../generate-storyboard/route';

// Input validation schema
const generateVideoSchema = z.object({
  frames: z.array(z.object({
    id: z.string(),
    imageUrl: z.string().url(),
    prompt: z.string(),
    scene: z.number(),
    metadata: z.record(z.string(), z.any()).optional()
  })).min(2),
  options: z.object({
    fps: z.number().default(30),
    duration: z.number().default(30),
    style: z.string().optional(),
    resolution: z.string().default('1080p'),
    motionStrength: z.number().min(0).max(1).default(0.7)
  }).optional()
});

// Response type definition
export interface GeneratedVideo {
  videoUrl: string;
  thumbnailUrl: string;
  metadata: {
    duration: number;
    frameCount: number;
    keyframeCount: number;
  };
}

// Mock function for video interpolation
// In production, this would connect to a video interpolation API or model
async function interpolateFramesToVideo(
  frames: GeneratedFrame[],
  options: {
    fps: number;
    duration: number;
    style?: string;
    resolution: string;
    motionStrength: number;
  }
): Promise<GeneratedVideo> {
  // This is a mock - in production, would call actual video interpolation service
  // Simulating video processing delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // In a real implementation, this would process frames through a service like:
  // - Deforum for Stable Diffusion
  // - Gen-2 from Runway
  // - Pika Labs
  // - Or a custom video interpolation model
  
  // Calculate frame count based on FPS and duration
  const frameCount = options.fps * options.duration;
  
  // Return mock video data
  return {
    videoUrl: "https://example.com/generated-video.mp4",
    thumbnailUrl: frames[0].imageUrl, // Use first frame as thumbnail
    metadata: {
      duration: options.duration,
      frameCount: frameCount,
      keyframeCount: frames.length
    }
  };
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = generateVideoSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { frames, options = {} } = validation.data;
    
    // Set default options
    const videoOptions = {
      fps: options.fps || 30,
      duration: options.duration || 30,
      style: options.style,
      resolution: options.resolution || '1080p',
      motionStrength: options.motionStrength ?? 0.7
    };
    
    // Sort frames by scene number to ensure correct sequence
    const sortedFrames = [...frames].sort((a, b) => a.scene - b.scene);
    
    // Generate video from frames
    const video = await interpolateFramesToVideo(sortedFrames, videoOptions);
    
    // Return the generated video information
    return NextResponse.json(video);
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: 'Failed to generate video', code: 'ERR_VIDEO_GEN' },
      { status: 500 }
    );
  }
} 