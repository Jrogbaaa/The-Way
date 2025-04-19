import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const predictionId = params.id; 

  if (!predictionId) {
    return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 });
  }

  try {
    console.log(`Checking prediction status for ID: ${predictionId}`);
    const prediction = await replicate.predictions.get(predictionId);
    console.log(`Prediction status: ${prediction.status}`);

    // Enhanced logging for debugging
    if (prediction.output !== undefined) {
      console.log(`Prediction has output of type: ${typeof prediction.output}`);
      console.log(`Output is array: ${Array.isArray(prediction.output)}`);
      
      // Sanitize output if it's an array
      if (Array.isArray(prediction.output)) {
        prediction.output = prediction.output.filter(item => {
          if (typeof item === 'string' && item.length > 0) return true;
          console.log('Filtering out invalid output item:', item);
          return false;
        });
        console.log(`Sanitized output array length: ${prediction.output.length}`);
      }
    }
    
    if (prediction.error) {
      console.error('Replicate prediction error:', prediction.error);
      return NextResponse.json({ 
        error: prediction.error,
        status: 'failed',
        id: predictionId 
      }, { status: 500 });
    }
    
    // Make sure the output format is consistent
    // If the prediction succeeded but has no output, treat it as an error
    if (prediction.status === 'succeeded' && 
        (prediction.output === undefined || prediction.output === null ||
         (Array.isArray(prediction.output) && prediction.output.length === 0))) {
      console.error('Prediction succeeded but has no valid output');
      return NextResponse.json({ 
        error: 'Prediction completed but produced no valid output',
        status: 'failed',
        id: predictionId 
      }, { status: 500 });
    }

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch prediction status', 
      details: errorMessage,
      status: 'failed',
      id: predictionId 
    }, { status: 500 });
  }
} 