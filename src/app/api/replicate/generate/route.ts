import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { model, input } = await req.json();
    
    if (!model) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing model parameter'
      }, { status: 400 });
    }
    
    if (!input || !input.prompt) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing prompt in input'
      }, { status: 400 });
    }
    
    console.log(`Generating image with Replicate model: ${model}`);
    console.log(`Prompt: ${input.prompt}`);
    
    // Try using predictions API first for better control over completion
    let output;
    let predictionId: string | null = null;
    
    try {
      // Use predictions.create instead of run for better control
      console.log('Creating prediction with Replicate...');
      const prediction = await replicate.predictions.create({
        version: model,
        input: {
          prompt: input.prompt,
          ...input // Pass any additional parameters
        }
      });
      
      predictionId = prediction.id;
      console.log(`Created prediction ${predictionId}, waiting for completion...`);
      
      // Wait for the prediction to complete
      let completedPrediction = prediction;
      let attempts = 0;
      const maxAttempts = 60; // Wait up to 60 * 2 = 120 seconds
      
      while (completedPrediction.status === 'starting' || completedPrediction.status === 'processing') {
        if (attempts >= maxAttempts) {
          throw new Error(`Prediction timed out after ${maxAttempts * 2} seconds`);
        }
        
        console.log(`Prediction ${predictionId} status: ${completedPrediction.status}, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        completedPrediction = await replicate.predictions.get(predictionId);
        attempts++;
      }
      
      console.log(`Prediction ${predictionId} completed with status: ${completedPrediction.status}`);
      console.log('Final prediction output:', completedPrediction.output);
      
      if (completedPrediction.status === 'failed') {
        throw new Error(`Prediction failed: ${completedPrediction.error || 'Unknown error'}`);
      }
      
      if (completedPrediction.status === 'canceled') {
        throw new Error('Prediction was canceled');
      }
      
      output = completedPrediction.output;
      
    } catch (predictionError: any) {
      console.error('Prediction API error:', predictionError);
      
      // Fallback to run() method if predictions API fails
      console.log('Falling back to replicate.run() method...');
      
      try {
        output = await replicate.run(model as any, {
          input: {
            prompt: input.prompt,
            ...input
          }
        });
        
        // Handle ReadableStream response
        if (output && Array.isArray(output) && output.length > 0 && output[0] && typeof output[0] === 'object' && 'readable' in output[0]) {
          console.log('Received ReadableStream in array, attempting to handle...');
          
          const stream = output[0] as ReadableStream;
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let result = '';
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              if (value) {
                const chunk = decoder.decode(value, { stream: true });
                result += chunk;
                console.log('Stream chunk:', chunk);
              }
            }
            
            console.log('Complete stream result:', result);
            
            // Try to parse the result as JSON or extract URL
            try {
              const parsed = JSON.parse(result);
              output = parsed;
            } catch (parseError) {
              // If not JSON, try to extract URL from text
              const urlMatch = result.match(/https?:\/\/[^\s]+/);
              if (urlMatch) {
                output = [urlMatch[0]];
              } else {
                throw new Error('Could not extract image URL from stream');
              }
            }
            
          } catch (streamError) {
            console.error('Error reading stream:', streamError);
            throw new Error('Failed to read streaming response from Replicate');
          }
        }
        
      } catch (runError: any) {
        console.error('Both prediction and run methods failed:', runError);
        throw new Error(`Replicate generation failed: ${runError.message || runError}`);
      }
    }
    
    console.log('Final output:', output);
    console.log('Output type:', typeof output);
    console.log('Is array:', Array.isArray(output));
    
    // Handle different response formats
    let imageUrl: string | null = null;
    
    if (Array.isArray(output)) {
      // If output is an array, take the first element
      if (output.length > 0) {
        imageUrl = output[0];
      }
    } else if (typeof output === 'string') {
      // If output is a string URL
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      // If output is an object, try to extract URL from common properties
      if ('url' in output) {
        imageUrl = output.url as string;
      } else if ('image' in output) {
        imageUrl = output.image as string;
      } else if ('images' in output && Array.isArray(output.images)) {
        imageUrl = output.images[0];
      } else {
        console.warn('Unknown output format:', output);
        throw new Error('Unable to extract image URL from Replicate response');
      }
    } else {
      console.warn('Unexpected output format:', output);
      throw new Error('Invalid response format from Replicate API');
    }
    
    // Validate that we got a valid URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('No valid image URL found in output:', output);
      throw new Error('No image URL returned from Replicate');
    }
    
    // Validate URL format
    try {
      new URL(imageUrl);
    } catch (urlError) {
      console.error('Invalid URL format:', imageUrl);
      throw new Error('Invalid image URL format returned from Replicate');
    }
    
    console.log('Successfully extracted image URL:', imageUrl);
    
    // Return the result
    return NextResponse.json({
      status: 'success',
      imageUrl: imageUrl,
      predictionId: predictionId,
      output: output, // Keep original output for debugging
      seed: Date.now()
    });
    
  } catch (error: any) {
    console.error('Replicate generation error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Failed to generate image',
      details: error.toString()
    }, { status: 500 });
  }
} 