import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/edit-image: Starting request processing');
    
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const promptText = formData.get('prompt') as string;

    if (!imageFile) {
      console.error('No image file provided in form data');
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!promptText) {
      console.error('No prompt text provided in form data');
      return NextResponse.json({ error: 'No prompt text provided' }, { status: 400 });
    }

    console.log('Image file received:', imageFile.name, imageFile.type, imageFile.size + ' bytes');
    console.log('Prompt received:', promptText);
    
    // Convert the file to a buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Get Google AI Studio API key from environment variable
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key not found in environment variables');
      return NextResponse.json({ 
        error: 'API service unavailable',
        details: 'Image editing service is not properly configured',
      }, { status: 503 });
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageFile.type;

    // Prepare the prompt
    const prompt = `Please edit this image based on the following instruction: "${promptText}". Make the edited image look natural and professional.`;

    // Try the image editing with Gemini API first
    try {
      console.log('Using Gemini image generation API via REST...');
      
      // Configure safety settings
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ];
      
      // Create a REST API call directly to the image generation model
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
      
      // Prepare the request body with image and text
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }],
        generation_config: {
          temperature: 0.4,
          top_k: 32,
          top_p: 1,
          max_output_tokens: 4096,
          responseModalities: ["TEXT", "IMAGE"]
        },
        safety_settings: safetySettings.map(setting => ({
          category: setting.category,
          threshold: setting.threshold
        }))
      };
      
      console.log('Sending request to Gemini image editing endpoint...');
      
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Add timeout to avoid DEADLINE_EXCEEDED errors
      });
      
      console.log('Gemini API response received');
      console.log('Response status:', response.status);
      
      // Add more detailed logging to see what's in the response
      if (response.data) {
        console.log('Response has data');
        if (response.data.candidates) {
          console.log(`Found ${response.data.candidates.length} candidates`);
          const candidate = response.data.candidates[0];
          if (candidate && candidate.content) {
            console.log('Candidate has content');
            if (candidate.content.parts) {
              console.log(`Found ${candidate.content.parts.length} parts`);
              
              // Detailed logging of parts content
              candidate.content.parts.forEach((part: any, index: number) => {
                console.log(`Part ${index} type:`, part.text ? 'text' : part.inline_data ? 'inline_data' : 'unknown');
                if (part.text) {
                  console.log(`Part ${index} text (first 50 chars):`, part.text.substring(0, 50));
                }
                if (part.inline_data) {
                  console.log(`Part ${index} is inline_data with mime_type:`, part.inline_data.mime_type);
                  console.log(`Part ${index} has data of length:`, part.inline_data.data.length);
                }
              });
            }
          }
        }
      }
      
      // Process the response to extract the image
      if (response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts) {
        
        const parts = response.data.candidates[0].content.parts;
        console.log(`Found ${parts.length} parts in the response`);
        
        // Look for inline_data in the parts
        for (const part of parts) {
          if (part.inline_data && part.inline_data.mime_type.startsWith('image/')) {
            console.log('Found image in API response');
            const imageData = Buffer.from(part.inline_data.data, 'base64');
            const imageMimeType = part.inline_data.mime_type;
            return sendImageResponse(imageData, imageMimeType);
          }
        }
        
        // If no image found, check for URLs in text responses
        for (const part of parts) {
          if (part.text) {
            console.log('Found text in response, checking for image URLs');
            const urls = extractImageUrlsFromText(part.text);
            if (urls.length > 0) {
              console.log('Found image URL in text response:', urls[0]);
              const { buffer, contentType } = await downloadImage(urls[0]);
              return sendImageResponse(buffer, contentType);
            }
          }
        }
      }
      
      // If no image found in response, throw error
      console.error('No image found in Gemini API response');
      throw new Error('No image found in Gemini API response');
      
    } catch (geminiError) {
      console.error('Error with Gemini API:', geminiError);
      
      // Return a more helpful error to the client
      return NextResponse.json({
        error: 'Image editing service temporarily unavailable',
        details: 'The image editing service encountered an error processing your request.',
        message: 'Please try again later or with a different prompt.',
        technicalDetails: geminiError instanceof Error ? geminiError.message : 'Unknown error'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Error editing image:', error);
    return NextResponse.json(
      { 
        error: 'Image editing failed',
        message: error instanceof Error ? error.message : 'Unknown error processing your request',
        suggestion: 'Try using a different image or simplify your editing request'
      },
      { status: 500 }
    );
  }
}

/**
 * Extract image URLs from text response
 */
function extractImageUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:[^\s]*)?)/gi;
  return (text.match(urlRegex) || []);
}

/**
 * Download an image from a URL
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer, contentType: string }> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    return {
      buffer: Buffer.from(response.data),
      contentType
    };
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download generated image');
  }
}

/**
 * Send an image response
 */
function sendImageResponse(imageBuffer: Buffer, mimeType: string): NextResponse {
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': imageBuffer.length.toString(),
      'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
    }
  });
} 