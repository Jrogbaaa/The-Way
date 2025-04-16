import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { Buffer } from 'buffer';
import FormData from 'form-data';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || '',
  // Primary URL from documentation
  BRIA_API_URL: 'https://engine.prod.bria-api.com/v1'
};

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const direction = formData.get('direction') as string;
    const prompt = formData.get('prompt') as string | null;
    
    if (!imageFile || !direction) {
      return NextResponse.json({
        success: false,
        error: 'Image and direction are required'
      }, { status: 400 });
    }

    // Get BRIA API key
    const BRIA_API_KEY = process.env.BRIA_AI_API_KEY;
    
    if (!BRIA_API_KEY) {
      console.error('BRIA_AI_API_KEY not found in environment variables');
      return NextResponse.json({
        success: false,
        error: 'API key not configured'
      }, { status: 500 });
    }

    // Log the key prefix/suffix for debugging (don't log the full key)
    console.log('Using API key:', BRIA_API_KEY.substring(0, 4) + '...' + BRIA_API_KEY.substring(BRIA_API_KEY.length - 4));
    
    // Try different authentication methods
    const authFormats = [
      { headers: { 'x-api-key': BRIA_API_KEY } },
      { headers: { 'api-key': BRIA_API_KEY } },
      { headers: { 'Authorization': `Bearer ${BRIA_API_KEY}` } },
      { headers: { 'Authorization': BRIA_API_KEY } },
      { params: { api_key: BRIA_API_KEY } }
    ];
    
    // Read the uploaded file as ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);

    // Try all API base URLs from most to least preferred
    const API_BASE_URLS = [
      // Primary URL from documentation
      'https://engine.prod.bria-api.com/v1',
      // Alternate URLs
      'https://api.bria.ai/api/v2',
      'https://api.bria.ai/v2',
      'https://api.bria.ai'
    ];
    
    for (const API_BASE_URL of API_BASE_URLS) {
      console.log(`Trying API base URL: ${API_BASE_URL}`);
      
      try {
        // First try direct upload to expansion endpoint
        console.log('ATTEMPT 1: Direct upload to expansion endpoint');
        
        // Create a Node.js form-data object
        const nodeFormData = new FormData();
        
        // Add the buffer as a file
        nodeFormData.append('image', buffer, {
          filename: imageFile.name || 'image.jpg',
          contentType: imageFile.type || 'image/jpeg',
        });
        nodeFormData.append('direction', direction);
        
        if (prompt) {
          nodeFormData.append('prompt', prompt);
        }
        
        nodeFormData.append('num_results', '1');
        nodeFormData.append('sync', 'true');
        
        const directUrl = `${API_BASE_URL}/expand`;
        console.log(`Posting to: ${directUrl}`);
        
        const directResponse = await axios.post(directUrl, nodeFormData, {
          headers: {
            ...authFormats[0].headers,
            ...nodeFormData.getHeaders(),
          },
        });
        
        console.log('Direct expansion response status:', directResponse.status);
        
        if (directResponse.status === 200) {
          console.log('Direct expansion successful!');
          return NextResponse.json({
            success: true,
            results: directResponse.data.results,
            method: 'direct-upload'
          });
        }
      } catch (err: any) {
        console.error('Direct expansion failed:', err.message);
        if (err.response) {
          console.error('Error response data:', err.response.status, err.response.data);
        }
      }
      
      // Then try register + expand method with multiple auth formats
      for (const authFormat of authFormats) {
        console.log(`ATTEMPT 2: Trying register + expand with auth format:`, JSON.stringify(authFormat));
        
        try {
          // Step 1: Register the image
          const nodeRegisterFormData = new FormData();
          
          // Add the buffer as a file
          nodeRegisterFormData.append('image', buffer, {
            filename: imageFile.name || 'image.jpg',
            contentType: imageFile.type || 'image/jpeg',
          });
          nodeRegisterFormData.append('response_type', 'json');
          
          const registerUrl = `${API_BASE_URL}/register`;
          console.log(`Registering image at: ${registerUrl}`);
          
          const registerResponse = await axios.post(
            registerUrl,
            nodeRegisterFormData,
            {
              ...authFormat,
              headers: {
                ...authFormat.headers,
                ...nodeRegisterFormData.getHeaders()
              }
            }
          );
          
          // Process response
          console.log('Register response:', registerResponse.status);
          
          if (registerResponse.status === 200 && registerResponse.data.visual_id) {
            const visualId = registerResponse.data.visual_id;
            console.log('Registered image with visual_id:', visualId);
            
            // Step 2: Expand the image
            const expansionData: {
              visual_id: string;
              direction: string;
              num_results: number;
              sync: boolean;
              prompt?: string;
            } = {
              visual_id: visualId,
              direction: direction,
              num_results: 1,
              sync: true
            };
            
            if (prompt) {
              expansionData.prompt = prompt;
            }
            
            const expandUrl = `${API_BASE_URL}/expand`;
            console.log(`Expanding image at: ${expandUrl}`);
            
            const expandResponse = await axios.post(expandUrl, expansionData, {
              headers: {
                ...authFormat.headers,
                'Content-Type': 'application/json',
              },
            });
            
            console.log('Expand response:', expandResponse.status);
            
            if (expandResponse.status === 200) {
              console.log('Expansion successful with register+expand!');
              return NextResponse.json({
                success: true,
                results: expandResponse.data.results,
                method: 'register+expand'
              });
            }
          }
        } catch (err: any) {
          console.error(`Register + Expand failed with auth format ${JSON.stringify(authFormat)}:`, err.message);
          if (err.response) {
            console.error('Error response data:', err.response.status, err.response.data);
          }
        }
      }
    }
    
    // All approaches failed
    console.error('⚠️ ALL APPROACHES FAILED');
    
    return NextResponse.json({
      success: false,
      error: 'All API approaches failed. Please check server logs for details.',
      // Include summary of all attempts for debugging
      debug: {
        attemptsMade: 2,
        lastError: 'See server logs for details'
      }
    }, { status: 500 });
  } catch (error: any) {
    console.error('Error in /api/bria/expand route:', error);
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message}`
    }, { status: 500 });
  }
} 