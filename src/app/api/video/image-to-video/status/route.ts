import { NextRequest, NextResponse } from 'next/server';
import { getReplicateClient } from '@/lib/replicate-client';
import { downloadAndCacheVideo } from '@/lib/video-cache';

export async function GET(request: NextRequest) {
  const predictionId = request.nextUrl.searchParams.get('id');
  
  if (!predictionId) {
    return NextResponse.json(
      { error: 'Missing prediction ID parameter' },
      { status: 400 }
    );
  }
  
  try {
    console.log(`Checking status for prediction: ${predictionId}`);
    
    const replicate = await getReplicateClient();
    
    if (!replicate) {
      return NextResponse.json(
        { error: 'Replicate client not configured' },
        { status: 500 }
      );
    }
    
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    try {
      const prediction = await replicate.predictions.get(predictionId);
      clearTimeout(timeoutId);
      
      console.log(`Prediction status: ${prediction.status}`);
      
      // If the prediction has completed successfully and has output, process the video
      let cachedVideoUrl = null;
      let dataUrl = null;
      
      if (prediction.status === 'succeeded' && prediction.output) {
        try {
          // The output from Replicate is often an array with the URL as the first element
          const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
          
          // Download and cache the video locally
          try {
            cachedVideoUrl = await downloadAndCacheVideo(videoUrl);
            console.log(`Video cached at: ${cachedVideoUrl}`);
          } catch (cacheError) {
            console.error('Error caching video:', cacheError);
            // Continue even if caching fails
          }
          
          // Also convert to data URL to prevent expiration issues
          try {
            // Set a longer timeout specifically for video downloading
            const videoFetchController = new AbortController();
            const videoTimeoutId = setTimeout(() => videoFetchController.abort(), 30000); // 30-second timeout
            
            const videoResponse = await fetch(videoUrl, {
              signal: videoFetchController.signal
            });
            
            clearTimeout(videoTimeoutId);
            
            if (videoResponse.ok) {
              const videoBuffer = await videoResponse.arrayBuffer();
              const videoBase64 = Buffer.from(videoBuffer).toString('base64');
              dataUrl = `data:video/mp4;base64,${videoBase64}`;
              console.log('Video converted to data URL successfully');
            } else {
              console.error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`);
            }
          } catch (dataUrlError) {
            console.error('Error creating data URL:', dataUrlError);
            // Continue even if data URL creation fails
          }
        } catch (processingError) {
          console.error('Error processing video output:', processingError);
        }
      }
      
      // Return the prediction data including status, output, and cached URL (if available)
      return NextResponse.json({
        id: prediction.id,
        status: prediction.status,
        output: dataUrl || prediction.output, // Prefer data URL if available
        originalOutput: prediction.output, // Keep original URL for reference
        cachedVideoUrl: cachedVideoUrl, // Add the cached URL to the response
        error: prediction.error,
        createdAt: prediction.created_at,
        completedAt: prediction.completed_at,
        metrics: prediction.metrics,
        dataUrl: !!dataUrl // Flag to indicate if data URL is available
      });
    } catch (replicateError) {
      clearTimeout(timeoutId);
      
      // Check if it's a timeout
      if (replicateError instanceof Error && replicateError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out while checking prediction status' },
          { status: 504 }
        );
      }
      
      // Check if it's a "not found" error
      if (replicateError instanceof Error && replicateError.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Prediction not found. It may have expired or been deleted.',
            notFound: true,
            predictionId
          },
          { status: 404 }
        );
      }
      
      throw replicateError;
    }
  } catch (error) {
    console.error('Error checking prediction status:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check prediction status',
        predictionId
      },
      { status: 500 }
    );
  }
} 