import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// Read token directly from environment
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Ensure API token is available 
if (!REPLICATE_API_TOKEN) {
  console.error('REPLICATE_API_TOKEN environment variable is not set.');
}

// Initialize Replicate client once at the module level
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// --- UNCOMMENTED POST Handler --- 
export async function POST(request: Request) {
  try {
    const { modelId, input } = await request.json();
    
    // Validate input
    if (!modelId || !input) {
      return NextResponse.json(
        { error: 'Missing modelId or input in request body' },
        { status: 400 }
      );
    }
    
    // Token check 
    if (!REPLICATE_API_TOKEN) {
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
      // Use predictions API for model/version
      const actualModelId = modelId as string; // Treat modelId as string
      console.log('Using predictions API for model/version:', actualModelId);
      
      // Extract version (handles both owner/name:version and just version_hash)
      let version: string | undefined;
      if (actualModelId.includes(':')) {
           const parts = actualModelId.split(':');
           version = parts[1]; // Assumes format owner/name:version
           console.log(`Extracted version ${version} from ${actualModelId}`);
      } else if (actualModelId.length > 50) { // Heuristic: likely a version hash
           version = actualModelId;
           console.log(`Using provided string as version hash: ${version}`);
      } else {
           console.error('Could not determine version from modelId:', actualModelId);
           return NextResponse.json(
                { error: 'Invalid model format. Expected owner/model:version or a version hash.' },
                { status: 400 }
           );
      }
            
      console.log('Creating prediction with version:', version);
      
      // Create a prediction using the version directly
      const prediction = await replicate.predictions.create({
        version: version,
        input: input,
      });
      
      console.log('Generic handler: Prediction created:', prediction.id, prediction.status);
      return NextResponse.json(prediction, { status: 201 });

    } catch (error: any) {
      console.error('Error calling Replicate:', error);
      let errorMessage = 'Failed to generate image using Replicate';
      if (error?.response?.status === 401) {
        errorMessage = 'Replicate API authentication failed. Check your API token.';
      } else if (error?.response?.status === 402) {
        errorMessage = 'Replicate API call failed: Payment required or credit limit reached.';
      } else if (error?.response?.status === 429) {
        errorMessage = 'Replicate API call failed: Rate limit exceeded.';
      } else if (error?.response?.status === 422) {
        errorMessage = 'Replicate API call failed: Invalid input or version. Check model parameters and version compatibility.';
      } else if (error.message) {
        errorMessage = `Replicate API Error: ${error.message}`;
      } 
      
      return NextResponse.json(
        { error: errorMessage, details: error.toString() }, 
        { status: error?.response?.status || 500 } // Use error status if available
      );
    }
  } catch (error: any) {
    console.error('Error parsing request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
} 