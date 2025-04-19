import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

/**
 * API route for generating videos from images
 * 
 * This endpoint uses the Hugging Face stabilityai/stable-video-diffusion-img2vid-xt model
 * via the existing image-to-video API to animate a static image into a fluid video.
 * The model is the same one that's been used throughout the application.
 */
export async function POST(request: Request) {
  try {
    const { imageUrl, prompt } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Animation prompt is required' },
        { status: 400 }
      );
    }
    
    console.log("Video generation request received with:", { imageUrl, prompt });
    
    // Call the existing image-to-video API to animate the image using Wan 2.1
    try {
      // Use a try-catch with a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
      
      // Use a relative URL to avoid connection issues
      const response = await fetch(`/api/video/image-to-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl,
          prompt: prompt,
          negative_prompt: "blurry, distorted, glitchy animation, low quality",
          motion_bucket_id: 127, // medium motion strength
          fps: 8,
          num_frames: 81, // Minimum required by Wan 2.1 model (about 10 seconds at 8fps)
          waitForResult: false // Don't wait - we'll poll for the result
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Clone the response for potential text reading if JSON parsing fails
      const responseClone = response.clone();
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to generate video: ${response.status} ${response.statusText}`);
        } catch (jsonError) {
          // If the response is not JSON, get the text content from the clone
          const errorText = await responseClone.text();
          throw new Error(`Failed to generate video (${response.status}): ${errorText.substring(0, 100)}...`);
        }
      }
      
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        throw new Error("Failed to parse API response");
      }
      
      // The response could directly include the output or a prediction ID
      if (data.output) {
        // If we got a direct output, check if it's a data URL or need to fetch
        console.log("Video generated immediately:", 
          typeof data.output === 'string' ? 
            data.output.substring(0, 50) + '...' : 
            'Non-string output');
            
        // If it's already a data URL, return it directly
        if (typeof data.output === 'string' && data.output.startsWith('data:')) {
          return NextResponse.json({ 
            videoUrl: data.output,
            imageUrl,
            prompt,
            success: true
          });
        }
        
        // If it's a URL to Replicate, fetch and convert to data URL
        if (typeof data.output === 'string' && data.output.startsWith('http')) {
          try {
            const videoResponse = await fetch(data.output, {
              // Set a longer timeout for video fetch
              signal: AbortSignal.timeout(60000) // 60-second timeout
            });
            
            if (!videoResponse.ok) {
              throw new Error(`Failed to fetch video from URL: ${videoResponse.status}`);
            }
            
            const videoBuffer = await videoResponse.arrayBuffer();
            const videoBase64 = Buffer.from(videoBuffer).toString('base64');
            const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;
            
            return NextResponse.json({ 
              videoUrl: videoDataUrl,
              originalUrl: data.output, // Keep original for reference
              imageUrl,
              prompt,
              success: true
            });
          } catch (fetchError) {
            console.error("Error fetching video from URL:", fetchError);
            // Return the URL but with a warning
            return NextResponse.json({ 
              videoUrl: data.output,
              imageUrl,
              prompt,
              warning: "Direct URL returned. May expire soon.",
              success: true
            });
          }
        }
        
        // Fallback for unexpected output format
        return NextResponse.json({ 
          videoUrl: data.output,
          imageUrl,
          prompt,
          success: true
        });
      } else if (data.predictionId) {
        // If we got a prediction ID, return it for polling
        console.log("Video generation started with prediction ID:", data.predictionId);
        
        return NextResponse.json({ 
          imageUrl,
          prompt,
          predictionId: data.predictionId,
          status: data.status || "started",
          message: "Video generation started. Check back soon for the result.",
          success: true
        });
      } else {
        throw new Error("No video URL or prediction ID returned");
      }
    } catch (error) {
      console.error("Error calling image-to-video API:", error);
      
      // Special handling for AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: "Request timed out. The server took too long to respond.", timeoutError: true },
          { status: 504 }
        );
      }
      
      // Handle network connection errors
      if (error instanceof Error && 
          (error.message.includes('ECONNREFUSED') || 
           error.message.includes('fetch failed'))) {
        return NextResponse.json(
          { 
            error: "Failed to connect to the video generation service. Please try again later.",
            details: error.message,
            fallbackVideoUrl: "https://placehold.co/600x400/black/white?text=Video+Generation+Error",
            success: false
          },
          { status: 500 }
        );
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('Error generating video:', error);
    
    // Return a fallback video URL for demonstration purposes
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : String(error),
        fallbackVideoUrl: "https://placehold.co/600x400/black/white?text=Video+Generation+Error",
        success: false
      },
      { status: 500 }
    );
  }
} 