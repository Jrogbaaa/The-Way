import { NextResponse } from 'next/server';
import Replicate from 'replicate';
// Remove unused import if API_CONFIG is no longer needed for the token
// import { API_CONFIG } from '@/lib/config';

/**
 * API Route: GET /api/models/check-replicate
 * Checks if the Replicate API token is configured in the environment.
 * Used for frontend checks or diagnostics.
 */
export async function GET() {
  const isConfigured = !!process.env.REPLICATE_API_TOKEN;
  
  if (!isConfigured) {
    console.warn('Replicate API check failed: Token not configured.');
    return NextResponse.json(
      { isConfigured: false, error: 'Replicate API token not configured' }, 
      { status: 500 }
    );
  }
  
  console.log('Replicate API check successful: Token is configured.');
  return NextResponse.json({ isConfigured: true });
} 