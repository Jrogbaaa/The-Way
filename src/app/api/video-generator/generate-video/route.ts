import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GeneratedFrame, GeneratedVideo } from '@/src/types/video-generator';

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

// ... rest of the file remains unchanged ... 