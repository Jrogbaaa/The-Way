import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';

// Initialize Replicate client
const replicate = new Replicate({
  auth: API_CONFIG.replicateApiToken,
});

// Well-known public models to test with
const PUBLIC_MODELS = {
  sdxl: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  flux: "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478"
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelId, input } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    console.log('Calling Replicate API with:', { modelId, input });
    
    // Use a public model for testing if directed to do so
    const actualModelId = modelId === "test" ? PUBLIC_MODELS.sdxl : modelId;
    
    try {
      // For SDXL and other well-known models, we can use the simple run API
      if (actualModelId === PUBLIC_MODELS.sdxl || actualModelId === PUBLIC_MODELS.flux) {
        console.log('Using public model:', actualModelId);
        const output = await replicate.run(actualModelId, { input });
        return NextResponse.json({ output });
      }
      
      // For custom models, try the predictions API directly
      console.log('Using custom model, falling back to predictions API');
      
      // Convert model IDs to versions (for well-formed IDs like 'owner/name:version')
      const [ownerModel, version] = actualModelId.split(':');
      
      if (!version) {
        return NextResponse.json(
          { error: 'Invalid model format. Expected owner/model:version' },
          { status: 400 }
        );
      }
      
      console.log('Creating prediction with version:', version);
      
      // Create a prediction using the version directly
      const prediction = await replicate.predictions.create({
        version: version,
        input: input,
      });
      
      console.log('Prediction created:', prediction.id);
      
      // Wait for the prediction to complete
      const result = await replicate.wait(prediction);
      
      console.log('Prediction completed:', result.status);
      
      if (result.error) {
        console.error('Prediction error:', result.error);
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      console.log('Output type:', typeof result.output);
      console.log('Output value:', result.output);
      
      return NextResponse.json({ 
        output: result.output,
        debug: {
          predictionId: prediction.id,
          outputType: typeof result.output,
          outputIsArray: Array.isArray(result.output),
          outputLength: Array.isArray(result.output) ? result.output.length : 0
        }
      });
    } catch (runError: unknown) {
      console.error('Model API error:', runError);
      
      // If specific error for invalid version, provide a more helpful message
      if (typeof runError === 'object' && runError !== null && runError.toString().includes('Invalid version')) {
        return NextResponse.json(
          { 
            error: 'The model version either does not exist or your API key does not have permission to use it. Try using a public model like "stability-ai/sdxl" for testing.',
            originalError: runError.toString() 
          },
          { status: 422 }
        );
      }
      
      return NextResponse.json(
        { error: runError instanceof Error ? runError.message : String(runError) },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Replicate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 