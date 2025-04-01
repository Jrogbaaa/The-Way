import { NextResponse } from 'next/server';

export async function GET() {
  // Check if we have the required Replicate API token
  const isConfigured = 
    process.env.REPLICATE_API_TOKEN !== undefined && 
    process.env.REPLICATE_API_TOKEN !== "";

  return NextResponse.json({ 
    isConfigured,
    message: isConfigured ? "Replicate API is configured" : "Replicate API token is missing"
  });
} 