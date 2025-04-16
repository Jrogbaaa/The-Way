import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// BRIA API URL based on their documentation
const BRIA_API_URL = 'https://engine.prod.bria-api.com/v1';

interface GenFillPayload {
  file: string;
  mask_file: string;
  mask_type: string;
  prompt: string;
  negative_prompt?: string;
  num_results: number;
  sync: boolean;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  status?: number;
  details?: any;
}

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const maskFile = formData.get('mask') as File;
    const prompt = formData.get('prompt') as string;
    const negativePrompt = formData.get('negative_prompt') as string | null;
    const maskType = formData.get('mask_type') as string || 'manual';
    
    if (!imageFile || !maskFile || !prompt) {
      return NextResponse.json({
        success: false,
        error: 'Image, mask, and prompt are required'
      }, { status: 400 });
    }

    // Get BRIA API token
    const BRIA_API_TOKEN = process.env.BRIA_AI_API_KEY;
    
    if (!BRIA_API_TOKEN) {
      console.error('BRIA_AI_API_KEY not found in environment variables');
      return NextResponse.json({
        success: false,
        error: 'API token not configured'
      }, { status: 500 });
    }

    // Log the key prefix/suffix for debugging (don't log the full key)
    console.log('Using API token:', BRIA_API_TOKEN.substring(0, 4) + '...' + BRIA_API_TOKEN.substring(BRIA_API_TOKEN.length - 4));
    
    // Convert files to base64
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
    
    const maskArrayBuffer = await maskFile.arrayBuffer();
    const maskBase64 = Buffer.from(maskArrayBuffer).toString('base64');

    // Prepare request payload according to BRIA AI docs
    const payload: GenFillPayload = {
      file: imageBase64,
      mask_file: maskBase64,
      mask_type: maskType,
      prompt: prompt,
      num_results: 1,
      sync: true
    };
    
    // Add optional parameters if provided
    if (negativePrompt) {
      payload.negative_prompt = negativePrompt;
    }
    
    console.log('Sending GenFill request to BRIA AI');
    
    // Make the API call to BRIA
    const response = await axios.post(`${BRIA_API_URL}/gen_fill`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'api_token': BRIA_API_TOKEN
      }
    });
    
    // Handle successful response
    if (response.status === 200) {
      console.log('GenFill successful!');
      return NextResponse.json({
        success: true,
        results: response.data
      });
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error in /api/bria/genfill route:', error);
    
    // Provide detailed error information
    const errorResponse: ErrorResponse = {
      success: false,
      error: `API error: ${error.message}`
    };
    
    // Include response data if available
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', error.response.data);
      errorResponse.status = error.response.status;
      errorResponse.details = error.response.data;
    }
    
    // If there's a network error, try using a mock response for development
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('Network error, providing mock response for development');
      
      // Generate a mock URL that would be returned from the API
      const mockImageUrl = '/mock/genfill-result.png';
      
      return NextResponse.json({
        success: true,
        results: {
          urls: [mockImageUrl]
        },
        mock: true
      });
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 