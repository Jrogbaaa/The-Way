import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OpenAIStream } from 'ai';
import OpenAI from 'openai';
import { KeyframePrompt } from '@/src/types/video-generator';

// Input validation schema
const expandPromptSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.string().optional(),
  duration: z.number().default(30)
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  // ... rest of the file remains unchanged ...
} 