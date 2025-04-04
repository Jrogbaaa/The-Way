import { NextResponse } from 'next/server';
import { z } from 'zod';
import { KeyframePrompt, GeneratedFrame } from '@/src/types/video-generator';
import { v4 as uuidv4 } from 'uuid';

// Input validation schema
const generateStoryboardSchema = z.object({
  keyframePrompts: z.array(z.object({
    scene: z.number(),
    prompt: z.string(),
    cameraAngle: z.string().optional(),
    lighting: z.string().optional(),
    action: z.string().optional()
  })).min(1),
  characterReference: z.object({
    imageUrl: z.string().url().optional(),
    description: z.string().optional()
  }).optional()
});

// ... rest of the file remains unchanged ... 