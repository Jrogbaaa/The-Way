import { NextResponse } from 'next/server';

// Re-implementing the route instead of re-exporting
export async function POST(req: Request) {
  try {
    // Forward request to the implementation in src directory
    const response = await fetch(new URL(req.url).origin + '/api/video-generator/generate-storyboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await req.json()),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in video-generator/generate-storyboard route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 