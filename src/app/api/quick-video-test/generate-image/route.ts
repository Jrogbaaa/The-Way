import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would call an image generation API
    // For example, using Replicate or another service
    
    // For now, we'll just return mock data
    const imageUrl = `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(prompt.substring(0, 20))}`;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({ 
      imageUrl,
      prompt,
      success: true
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 