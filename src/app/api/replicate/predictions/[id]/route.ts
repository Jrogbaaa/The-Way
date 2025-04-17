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

    if (prediction.error) {
      console.error('Replicate prediction error:', prediction.error);
      return NextResponse.json({ error: prediction.error }, { status: 500 });
    }

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch prediction status', details: errorMessage }, { status: 500 });
  }
} 