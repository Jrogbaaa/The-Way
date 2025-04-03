/**
 * Standard Generations API Route
 * 
 * This endpoint handles image generation requests using Replicate's SDXL model.
 * It provides a standard interface for generating high-quality images from text prompts.
 * 
 * To use this API:
 * 1. Make a POST request with a prompt and optional negative prompt
 * 2. Receives prediction ID and later image URLs from Replicate's SDXL model
 * 
 * For detailed information, see the README.md
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
console.log('Standard Generations API environment check:', { 
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

// Add a utility function to safely handle output format issues
function getImageUrlsFromOutput(output: unknown): string[] {
  // If it's already an array of strings, return it
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
    return output;
  }
  
  // If it's a string, wrap it in an array
  if (typeof output === 'string') {
    return [output];
  }
  
  // If it's an object, try to extract URL
  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    
    // Check common fields where URLs might be stored
    const possibleFields = ['url', 'image', 'output'];
    for (const field of possibleFields) {
      if (obj[field]) {
        // If the field is an array of strings
        if (Array.isArray(obj[field]) && obj[field].length > 0 && typeof obj[field][0] === 'string') {
          return obj[field] as string[];
        }
        // If the field is a single string
        if (typeof obj[field] === 'string') {
          return [obj[field] as string];
        }
      }
    }
  }
  
  // If we couldn't extract anything, return an empty array
  console.error('Failed to extract image URLs from output:', output);
  return [];
}

// Update the function that handles extraction of image URLs from the result
function extractImageUrlsFromResult(result: any): string[] {
  try {
    if (!result) {
      console.error('Empty result object');
      return [];
    }
    
    // First check the output field
    if (result.output) {
      const urls = getImageUrlsFromOutput(result.output);
      if (urls.length > 0) {
        return urls;
      }
    }
    
    // Check for nested structures common in different APIs
    const possiblePaths = ['images', 'data.images', 'results', 'artifacts'];
    for (const path of possiblePaths) {
      const parts = path.split('.');
      let current = result;
      
      // Navigate to the nested property
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      
      // If we found a valid array
      if (Array.isArray(current) && current.length > 0) {
        // Check if it's an array of strings (direct URLs)
        if (typeof current[0] === 'string') {
          return current;
        }
        
        // Check if it's an array of objects with URL properties
        if (current[0] && typeof current[0] === 'object') {
          const urlArray: string[] = [];
          for (const item of current) {
            // Check common URL fields
            for (const field of ['url', 'image_path', 'base64']) {
              if (item[field] && typeof item[field] === 'string') {
                urlArray.push(item[field]);
                break;
              }
            }
          }
          
          if (urlArray.length > 0) {
            return urlArray;
          }
        }
      }
    }
    
    console.error('Could not extract image URLs from result:', result);
    return [];
  } catch (error) {
    console.error('Error extracting image URLs:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, numOutputs = 1, waitForResult = false } = body;

    console.log('Standard Generations API called with prompt:', prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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
      // Use the Replicate API directly to generate images with SDXL
      const modelId = AI_MODELS.sdxl.id;
      const version = AI_MODELS.sdxl.version;
      const fullModelId = `${modelId}:${version}`;
      
      console.log('Calling Replicate API with model:', fullModelId);
      
      // Create a prediction using the Replicate API
      const prediction = await replicate.predictions.create({
        version: version,
        input: {
          prompt,
          negative_prompt: negativePrompt || "",
          num_outputs: Number(numOutputs),
          width: 1024,
          height: 1024,
          num_inference_steps: 25,
          guidance_scale: 7.5,
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
          message: "Image generation has started",
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
          message: "Failed to generate image",
          output: [getPlaceholderImageUrl()],
          predictionId: prediction.id,
          status: 'failed'
        }, { status: 500 });
      }
      
      // Extract image URLs from the result using our new helper
      let imageUrls = extractImageUrlsFromResult(result);
      console.log('Generated images:', imageUrls);
      
      // Validate each URL
      if (imageUrls.length > 0) {
        // Filter out invalid URLs
        imageUrls = imageUrls.filter(url => {
          try {
            new URL(url);
            return true; // URL is valid
          } catch (e) {
            console.error('Invalid URL in result:', url);
            return false;
          }
        });
      }
      
      // If we still don't have valid URLs, use a placeholder
      if (imageUrls.length === 0) {
        console.error('No valid images returned from Replicate');
        imageUrls = [getPlaceholderImageUrl()];
        
        return NextResponse.json({
          error: 'No images were generated',
          message: "Failed to generate image",
          output: imageUrls,
          predictionId: prediction.id,
          status: 'failed',
          debug: {
            predictionId: prediction.id,
            status: result.status,
          }
        }, { status: 500 });
      }
      
      return NextResponse.json({
        output: imageUrls,
        message: "Image generated successfully with SDXL",
        predictionId: prediction.id,
        status: 'succeeded',
        debug: {
          promptUsed: prompt,
          numOutputs,
          negativePrompt,
          modelId: fullModelId,
          predictionId: prediction.id,
        }
      });
    } catch (error) {
      console.error('Replicate API error:', error);
      // Check for rate limits/auth errors
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('Invalid API key')) {
        return NextResponse.json({ 
          error: 'Invalid Replicate API key. Please check your REPLICATE_API_TOKEN.',
          message: "Failed to generate image due to authentication error",
          output: [getPlaceholderImageUrl()],
          status: 'failed'
        }, { status: 401 });
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
        return NextResponse.json({ 
          error: 'Replicate rate limit exceeded. Please try again later.',
          message: "Failed to generate image due to rate limiting",
          output: [getPlaceholderImageUrl()],
          status: 'failed'
        }, { status: 429 });
      }
      
      return NextResponse.json({ 
        error: errorMsg,
        message: "Failed to generate image",
        output: [getPlaceholderImageUrl()],
        status: 'failed'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : String(error),
        output: [getPlaceholderImageUrl()],
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
        output: prediction.result?.output || [],
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
        output: replicatePrediction.output || [],
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
      output: prediction.output || [],
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

// Helper function to get a placeholder image URL
function getPlaceholderImageUrl() {
  const placeholderImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAIAAABEtEjdAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9zzTtmrIVkKMRP+nhE7V1zsKGqtqDhpa1YzU09PmIetuOTULaf0T/qA9pd7SK5aDr4+P/kmDH5uepJ555GPv5kKF4aqvjJXi50Uy0DzrXl6GgSYj1/HL/ba15lOuUic9vTm4d3YUVdT3Ks2L21vNHR/ZxnXt6MrG9jqM3QXn+C9nOK/QZU9rHAGcPh+JtSSSNe/9s8WXdzdDxuY3HX664JYxj8+fLi+v7+7v797e3d3d9/fvz/7Zd9AT+/wbGwL7t9yOvvFxdw/B6fEtaR75RzJ4oAAMC1JREFUeAHt3euSJDeSBOCD1Rhdxsz2/m+1Y6aZaWZN1FWUc08E8yM8MoCTFUW5MYQ/r//nf/7n//z+/ftV//Dz58//xJ/9/Pnz//vv//zn//7+++9//fz54z//Wf/82//+9+f//v79+9fP//7n//7+9fPv//71989//fz3v3/989//+9e/fvz69fPXf3/8/PnPf/78+fP/+Mevnz9+/fr54/ePf/349Y9fP3/88evnr58//vELAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABglte+p3/8+PHPP/pR//jx48/Pnz9//PxBFQAAKupr+nrdatnrRy3+tRVe9Y/Xq5b/ePHixYsXL168ePGCKgAANPS1jq+er1o+1vN6Pv7w3mDr8+sD6gPqA+oD6gPqAz7hA/4X8i1c5I0xdvwAAAAASUVORK5CYII=';
  return `data:image/png;base64,${placeholderImageBase64}`;
} 