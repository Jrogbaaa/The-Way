import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get('predictionId');
  
  if (!predictionId) {
    return NextResponse.json(
      { error: 'Prediction ID is required' },
      { status: 400 }
    );
  }

  // Log the request for debugging
  console.log(`Checking status for prediction: ${predictionId}`);
  
  try {
    // Call the existing API to check the status using the prediction ID
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/video/image-to-video/status?predictionId=${predictionId}`;
    
    console.log(`Calling status endpoint: ${statusUrl}`);
    
    const response = await fetch(statusUrl);
    
    // Clone response for potential text reading if JSON parsing fails
    const responseClone = response.clone();
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status check failed: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        // If response is not JSON, get text content
        const errorText = await responseClone.text();
        throw new Error(`Status check failed (${response.status}): ${errorText.substring(0, 100)}...`);
      }
    }
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      throw new Error("Failed to parse status API response");
    }
    
    console.log("Status response:", data);
    
    // Return the status response
    return NextResponse.json({
      predictionId,
      status: data.status,
      videoUrl: data.output,
      error: data.error,
      message: data.message || (data.status === "succeeded" ? "Video generation complete!" : "Video generation in progress..."),
      success: true
    });
    
  } catch (error) {
    console.error('Error checking prediction status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 