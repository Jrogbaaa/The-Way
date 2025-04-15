import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

/**
 * API route to check Replicate API connectivity and token validity
 * GET /api/models/check-replicate
 */
export async function GET() {
  try {
    // Get API token with fallbacks
    const apiToken = process.env.REPLICATE_API_TOKEN || API_CONFIG.replicateApiToken || '';
    
    // Check if we have an API token
    if (!apiToken) {
      return NextResponse.json({
        success: false,
        error: 'Replicate API token is not configured',
        tokenStatus: 'missing'
      }, { status: 500 });
    }
    
    // Mask the token for security
    const maskedToken = apiToken.substring(0, 3) + '...' + apiToken.substring(apiToken.length - 3);
    
    try {
      // Make a test call to Replicate API
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'HEAD',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Successfully connected to Replicate API',
          tokenStatus: 'valid',
          maskedToken,
          statusCode: response.status
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Replicate API returned status: ${response.status}`,
          tokenStatus: 'invalid',
          maskedToken,
          statusCode: response.status
        }, { status: 400 });
      }
    } catch (fetchError) {
      console.error('Error connecting to Replicate API:', fetchError);
      
      return NextResponse.json({
        success: false,
        error: `Network error connecting to Replicate API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        tokenStatus: 'unknown',
        maskedToken
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in check-replicate route:', error);
    
    return NextResponse.json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
} 