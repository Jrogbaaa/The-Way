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
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI Studio API key not configured' }, { status: 500 });
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);

    // For models that support image editing features
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-001" });

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageFile.type;

    // Prepare the prompt with the image
    const prompt = `${promptText}. Make the edited image look natural and professional.`;

    // Create image part from base64 data
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ];

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

    console.log('Generating image with Gemini...');

    try {
      // Generate content using the image and prompt
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [...imageParts, { text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
        safetySettings
      });
      
      const response = result.response;
      console.log('Gemini response received');

      // Extract the image data from the response
      const responseText = response.text();
      if (!responseText || !response.candidates || response.candidates.length === 0) {
        throw new Error('No valid response from Gemini API');
      }
      
      // Check if there are any images in the response
      if (!response.candidates[0].content.parts ||
          !response.candidates[0].content.parts.some(part => part.inlineData?.mimeType?.startsWith('image/'))) {
        // If no images found, check if there's a URL to an image
        const urls = extractImageUrlsFromText(responseText);
        if (urls.length > 0) {
          // Download the first image and return it
          console.log('Found image URL in response:', urls[0]);
          const downloadedImage = await downloadImage(urls[0]);
          return sendImageResponse(downloadedImage.buffer, downloadedImage.contentType);
        } else {
          throw new Error('No image found in Gemini response');
        }
      }
      
      // Get the first image from the response
      const imagePart = response.candidates[0].content.parts.find(
        part => part.inlineData?.mimeType?.startsWith('image/')
      );
      
      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image found in Gemini response');
      }
      
      // Decode the base64 image data
      const imageData = Buffer.from(imagePart.inlineData.data, 'base64');
      const imageMimeType = imagePart.inlineData.mimeType;
      
      // Return the image
      return sendImageResponse(imageData, imageMimeType);
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      
      // Fallback to a different model or approach
      // For now, we'll just return an error
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Error generating edited image',
        details: 'The Gemini model may not fully support image generation capabilities needed for this edit.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error editing image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error editing image' },
      { status: 500 }
    );
  }
}

/**
 * Extract image URLs from text response
 */
function extractImageUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
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