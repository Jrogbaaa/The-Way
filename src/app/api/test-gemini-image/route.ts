import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Gemini image generation...');
    
    // Get Google AI Studio API key from environment variable
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key not found in environment variables');
      return NextResponse.json({ 
        error: 'API service unavailable',
        details: 'Image generation service is not properly configured',
      }, { status: 503 });
    }
    
    // Create a REST API call directly to the image generation model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
    
    // Simple text-to-image request
    const requestBody = {
      contents: [{
        parts: [
          { text: "Generate a colorful image of a cute cartoon robot holding a flower" }
        ]
      }],
      generation_config: {
        temperature: 0.4,
        top_k: 32,
        top_p: 1,
        max_output_tokens: 4096,
        responseModalities: ["TEXT", "IMAGE"]
      }
    };
    
    console.log('Sending request to Gemini image generation endpoint...');
    
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('Gemini API response received');
    console.log('Response status:', response.status);
    
    // Log the full response for debugging (with sensitive data redacted)
    const responseDataCopy = JSON.parse(JSON.stringify(response.data));
    if (responseDataCopy.candidates) {
      responseDataCopy.candidates.forEach((candidate: any) => {
        if (candidate.content && candidate.content.parts) {
          candidate.content.parts.forEach((part: any) => {
            if (part.inline_data && part.inline_data.data) {
              part.inline_data.data = `[BASE64_DATA_LENGTH:${part.inline_data.data.length}]`;
            }
          });
        }
      });
    }
    console.log('Response data:', JSON.stringify(responseDataCopy, null, 2));
    
    // Process the response to extract the image
    if (response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts) {
      
      const parts = response.data.candidates[0].content.parts;
      console.log(`Found ${parts.length} parts in the response`);
      
      // Look for inline_data in the parts
      for (const part of parts) {
        if (part.inline_data && part.inline_data.mime_type && part.inline_data.mime_type.startsWith('image/')) {
          console.log('Found image in API response');
          const imageData = Buffer.from(part.inline_data.data, 'base64');
          const imageMimeType = part.inline_data.mime_type;
          
          return new NextResponse(imageData, {
            headers: {
              'Content-Type': imageMimeType,
              'Content-Length': imageData.length.toString(),
              'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
            }
          });
        }
        
        if (part.text) {
          console.log('Found text in response:', part.text);
        }
      }
    }
    
    // If no image found in response
    console.error('No image found in Gemini API response');
    return NextResponse.json({
      error: 'No image generated',
      details: 'The Gemini API did not return an image in its response'
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('Error testing image generation:', error);
    
    return NextResponse.json({
      error: 'Image generation test failed',
      message: error.message || 'Unknown error',
      details: error.response?.data ? JSON.stringify(error.response.data) : 'No additional details'
    }, { status: 500 });
  }
} 