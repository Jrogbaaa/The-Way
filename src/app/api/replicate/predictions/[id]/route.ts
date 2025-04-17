import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Define the expected structure of the route parameters
interface RouteParams {
  params: {
    id: string; // Prediction ID
  };
}

/**
 * API Route: GET /api/replicate/predictions/[id]
 * Fetches the current status and result of a specific Replicate prediction.
 * Used by the frontend to poll for the completion of an asynchronous Replicate task (e.g., inpainting).
 * 
 * @param req - The Next.js request object (not used directly here).
 * @param params - Object containing the dynamic route parameters, specifically the prediction ID.
 * @returns A JSON response containing the full prediction object from Replicate 
 *          (including status, input, output, logs, etc.) or an error object.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const id = params.id;
  console.log(`Received request for /api/replicate/predictions/${id}`);

  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Server configuration error: Replicate API token missing' }, { status: 500 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 });
  }

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  try {
    const prediction = await replicate.predictions.get(id);
    console.log(`Fetched prediction status for ${id}:`, prediction.status);

    // Return the full prediction object (includes status, input, output, logs, etc.)
    return NextResponse.json(prediction);

  } catch (error: any) {
    console.error(`Error fetching Replicate prediction ${id}:`, error);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.message || 'Failed to fetch prediction status from Replicate';
    const errorDetails = error.response?.data?.detail || error.detail || {};

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: statusCode } // Use status code from Replicate error if available
    );
  }
} 