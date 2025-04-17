import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Read token directly from environment
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Initialize Replicate client once at the module level
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

/**
 * API Route: GET /api/replicate/predictions/[id]
 * Retrieves the status and results of a specific prediction.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure params is properly awaited in Next.js 13+
  const predictionId = params?.id;
  
  if (!predictionId) {
    return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 });
  }

  console.log(`Checking prediction status for ID: ${predictionId}`);

  try {
    const prediction = await replicate.predictions.get(predictionId);
    
    console.log(`Prediction status: ${prediction.status}`);
    
    return NextResponse.json(prediction, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching prediction ${predictionId}:`, error);
    
    const errorMessage = error?.response?.data?.detail || error.message || 'Unknown error';
    const statusCode = error?.response?.status || 500;
    
    return NextResponse.json(
      { error: 'Failed to fetch prediction status', detail: errorMessage },
      { status: statusCode }
    );
  }
} 