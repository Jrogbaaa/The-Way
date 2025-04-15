/**
 * Image-to-Video API Route
 * 
 * This endpoint handles video generation from images using Replicate's Wan 2.1 model.
 * It provides a standard interface for converting images to high-quality 720p videos.
 * 
 * To use this API:
 * 1. Make a POST request with:
 *    - image: URL or base64 of the source image
 *    - prompt: Optional text prompt to guide generation
 *    - Additional optional parameters for fine-tuning the output
 * 2. Receives prediction ID and later video URL from Replicate API
 */

import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { API_CONFIG, AI_MODELS } from '@/lib/config';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

// Debug variable to check configuration
const isConfigured = !!process.env.REPLICATE_API_TOKEN;

// Debug the configuration
console.log('Image-to-Video API environment check:', { 
  hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
  isConfigured
});

// Store active predictions
interface ActivePrediction {
  id: string;
  startTime: number;
  status: 'started' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  result?: any;
}

// In production, this would be stored in a database
// This is just for demo purposes
const activePredictions = new Map<string, ActivePrediction>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      image, 
      prompt = "", 
      negative_prompt = "", 
      num_frames = 16,
      num_inference_steps = 25,
      guidance_scale = 9.0,
      motion_bucket_id = 127,
      fps = 8,
      noise_aug_strength = 0.02,
      waitForResult = false 
    } = body;

    console.log('Image-to-Video API called with image:', image ? (typeof image === 'string' ? `${image.substring(0, 30)}...` : 'Image data provided') : 'No image');

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required (URL or base64)' },
        { status: 400 }
      );
    }

    // Check if Replicate API token is configured
    if (!isConfigured) {
      console.warn('Replicate API not configured, returning error');
      return NextResponse.json(
        { 
          error: 'Replicate API token is required',
          message: 'Please set the REPLICATE_API_TOKEN environment variable'
        },
        { status: 500 }
      );
    }

    try {
      // Use the Replicate API to generate video from image
      const modelId = AI_MODELS.wan2_i2v.id;
      const version = AI_MODELS.wan2_i2v.version;
      const fullModelId = `${modelId}:${version}`;
      
      console.log('Calling Replicate API with model:', fullModelId);
      
      // Create a prediction using the Replicate API
      const prediction = await replicate.predictions.create({
        version: version,
        input: {
          image,
          prompt,
          negative_prompt,
          num_frames,
          num_inference_steps,
          guidance_scale,
          motion_bucket_id,
          fps,
          noise_aug_strength
        },
        // Only use webhook in production with HTTPS URLs
        // Replicate requires HTTPS URLs for webhooks
        ...(process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ? {
          webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`,
          webhook_events_filter: ["completed"]
        } : {})
      });
      
      console.log('Prediction created:', prediction.id);
      
      // Store the prediction in the map
      activePredictions.set(prediction.id, {
        id: prediction.id,
        startTime: Date.now(),
        status: 'started',
      });
      
      // If client doesn't want to wait for the result, return the prediction ID
      if (!waitForResult) {
        return NextResponse.json({
          predictionId: prediction.id,
          status: 'started',
          message: "Video generation has started",
        });
      }
      
      // Otherwise, wait for the prediction to complete
      const result = await replicate.wait(prediction);
      console.log('Prediction completed:', result.status);
      
      // Update the prediction in the map
      activePredictions.set(prediction.id, {
        id: prediction.id,
        startTime: Date.now(),
        status: result.error ? 'failed' : 'succeeded',
        result
      });
      
      if (result.error) {
        console.error('Prediction error:', result.error);
        return NextResponse.json({ 
          error: result.error,
          message: "Failed to generate video",
          predictionId: prediction.id,
          status: 'failed'
        }, { status: 500 });
      }
      
      // Extract video URL from the result
      let videoUrl = '';
      
      if (result.output) {
        videoUrl = result.output;
        console.log('Generated video URL:', videoUrl);
      }
      
      // If we didn't get a valid video URL, return an error
      if (!videoUrl) {
        console.error('No valid video returned from Replicate');
        
        return NextResponse.json({
          error: 'No video was generated',
          message: "Failed to generate video",
          predictionId: prediction.id,
          status: 'failed',
          debug: {
            predictionId: prediction.id,
            status: result.status,
          }
        }, { status: 500 });
      }
      
      // Download the video and convert to base64 data URL to prevent URL expiration issues
      try {
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          throw new Error(`Failed to fetch video from Replicate: ${videoResponse.status} ${videoResponse.statusText}`);
        }
        
        const videoBuffer = await videoResponse.arrayBuffer();
        const videoBase64 = Buffer.from(videoBuffer).toString('base64');
        const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;
        
        return NextResponse.json({
          output: videoDataUrl,
          message: "Video generated successfully with Wan 2.1",
          predictionId: prediction.id,
          status: 'succeeded',
          debug: {
            promptUsed: prompt,
            modelId: fullModelId,
            predictionId: prediction.id,
          }
        });
      } catch (fetchError) {
        console.error('Error downloading video from Replicate:', fetchError);
        
        // Return the original URL as fallback, but note it will expire
        return NextResponse.json({
          output: videoUrl,
          message: "Video generated successfully with Wan 2.1, but couldn't be downloaded. URL will expire soon.",
          predictionId: prediction.id,
          status: 'succeeded',
          isTemporaryUrl: true,
          debug: {
            promptUsed: prompt,
            modelId: fullModelId,
            predictionId: prediction.id,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError)
          }
        });
      }
    } catch (error) {
      console.error('Replicate API error:', error);
      // Check for rate limits/auth errors
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('Invalid API key')) {
        return NextResponse.json({ 
          error: 'Invalid Replicate API key. Please check your REPLICATE_API_TOKEN.',
          message: "Failed to generate video due to authentication error",
          status: 'failed'
        }, { status: 401 });
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
        return NextResponse.json({ 
          error: 'Replicate rate limit exceeded. Please try again later.',
          message: "Failed to generate video due to rate limiting",
          status: 'failed'
        }, { status: 429 });
      }
      
      return NextResponse.json({ 
        error: errorMsg,
        message: "Failed to generate video",
        status: 'failed'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : String(error),
        status: 'failed'
      },
      { status: 500 }
    );
  }
}

// Create an endpoint to check prediction status
export async function GET(request: Request) {
  const url = new URL(request.url);
  const predictionId = url.searchParams.get('id');
  
  if (!predictionId) {
    return NextResponse.json(
      { error: 'Prediction ID is required' },
      { status: 400 }
    );
  }
  
  // If we have the prediction in our map, return its status
  if (activePredictions.has(predictionId)) {
    const prediction = activePredictions.get(predictionId)!;
    
    // If the prediction is complete, return the result
    if (prediction.status === 'succeeded' || prediction.status === 'failed') {
      return NextResponse.json({
        predictionId,
        status: prediction.status,
        output: prediction.result?.output || null,
        error: prediction.result?.error,
        processingTimeMs: Date.now() - prediction.startTime
      });
    }
    
    // Otherwise, check the status from Replicate
    try {
      const replicatePrediction = await replicate.predictions.get(predictionId);
      
      // Update our local copy
      prediction.status = replicatePrediction.status === 'succeeded' 
        ? 'succeeded' 
        : replicatePrediction.status === 'failed' 
          ? 'failed' 
          : 'processing';
      
      prediction.result = replicatePrediction;
      activePredictions.set(predictionId, prediction);
      
      return NextResponse.json({
        predictionId,
        status: prediction.status,
        output: replicatePrediction.output || null,
        error: replicatePrediction.error,
        processingTimeMs: Date.now() - prediction.startTime
      });
    } catch (error) {
      console.error('Error checking prediction status:', error);
      return NextResponse.json(
        { error: 'Failed to check prediction status' },
        { status: 500 }
      );
    }
  }
  
  // If we don't have the prediction in our map, try to get it from Replicate
  try {
    const prediction = await replicate.predictions.get(predictionId);
    
    // Add it to our map
    activePredictions.set(predictionId, {
      id: predictionId,
      startTime: new Date(prediction.created_at).getTime(),
      status: prediction.status === 'succeeded' 
        ? 'succeeded' 
        : prediction.status === 'failed' 
          ? 'failed' 
          : 'processing',
      result: prediction
    });
    
    return NextResponse.json({
      predictionId,
      status: prediction.status,
      output: prediction.output || null,
      error: prediction.error,
      processingTimeMs: Date.now() - new Date(prediction.created_at).getTime()
    });
  } catch (error) {
    console.error('Error getting prediction from Replicate:', error);
    return NextResponse.json(
      { error: 'Prediction not found' },
      { status: 404 }
    );
  }
} 