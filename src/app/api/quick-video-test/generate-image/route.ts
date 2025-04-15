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
    
    console.log("Image generation request received with prompt:", prompt);
    
    // Use the correct app URL from env vars or fallback to localhost:3000
    // Changed from 3003 to 3000 since the server appears to be running on 3000
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      // Call the existing imagen API to generate an image using Replicate's SDXL
      const response = await fetch(`${appUrl}/api/imagen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          negativePrompt: "blurry, distorted, low quality, unrealistic, ugly, deformed",
          numOutputs: 1,
          waitForResult: true // Wait for the result to come back
        }),
      });
      
      // Clone the response for potential text reading if JSON parsing fails
      const responseClone = response.clone();
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to generate image: ${response.status} ${response.statusText}`);
        } catch (jsonError) {
          // If the response is not JSON, get the text content from the clone
          const errorText = await responseClone.text();
          throw new Error(`Failed to generate image (${response.status}): ${errorText.substring(0, 100)}...`);
        }
      }
      
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        throw new Error("Failed to parse API response");
      }
      
      // The response could return URLs or a prediction ID
      let imageUrl = '';
      
      if (data.output && Array.isArray(data.output) && data.output.length > 0) {
        // Direct output means the image is ready
        imageUrl = data.output[0];
      } else if (data.predictionId) {
        // If we got a prediction ID, we would need to poll for it
        // For now, return an error that we need to wait
        throw new Error("The image generation is still in progress. Please try again in a moment.");
      } else {
        throw new Error("No image URL or prediction ID returned");
      }
      
      console.log("Generated image URL:", imageUrl);
      
      return NextResponse.json({ 
        imageUrl,
        prompt,
        success: true
      });
    } catch (fetchError) {
      // Fallback image for testing when the API connection fails
      console.error("Imagen API connection failed:", fetchError);
      
      return NextResponse.json({ 
        imageUrl: "https://placehold.co/600x400/orange/white?text=API+Connection+Error",
        prompt,
        success: false,
        error: "API connection failed, using fallback image",
        detail: fetchError instanceof Error ? fetchError.message : String(fetchError)
      });
    }
    
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 