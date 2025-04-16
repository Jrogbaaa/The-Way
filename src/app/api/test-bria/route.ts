import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { Buffer } from 'buffer';
import FormData from 'form-data';
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || '',
  BRIA_API_URL: process.env.BRIA_API_URL || 'https://api.bria.ai/api'
};

// For debugging purposes
const logApiResponse = (method: string, response: Response, responseData: any) => {
  console.log(`--- BRIA API ${method} Response ---`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  console.log('Data:', JSON.stringify(responseData, null, 2));
  console.log('------------------------');
};

// For debugging request payloads
const logApiRequest = (method: string, url: string, options: any) => {
  console.log(`--- BRIA API ${method} Request ---`);
  console.log(`URL: ${url}`);
  console.log('Headers:', options.headers);
  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    console.log('Body:', JSON.stringify(options.body, null, 2));
  } else if (typeof options.body === 'string') {
    console.log('Body (string):', options.body);
  } else {
    console.log('Body: [FormData or Binary]');
  }
  console.log('------------------------');
};

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/test-bria: Starting direct test of Bria API');
    
    // Get the configuration
    const host = request.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const briaKey = processEnv.BRIA_API_KEY;
    const briaUrl = processEnv.BRIA_API_URL;

    // Parse the form data
    const requestFormData = await request.formData();
    const imageFile = requestFormData.get('image') as File;
    const direction = requestFormData.get('direction') as string || 'bottom';
    const prompt = requestFormData.get('prompt') as string || '';

    console.log('Received request with:');
    console.log('- Image:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'None');
    console.log('- Direction:', direction);
    console.log('- Prompt:', prompt || 'None');

    if (!imageFile) {
      console.error('Image missing from request');
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // If Bria API key is not configured or set to the default placeholder, return a mock response
    if (!briaKey || briaKey === 'your_api_key_here') {
      console.log('BRIA API key not configured, returning mock response');
      
      // Mock URL based on direction
      let mockImageUrl = '';
      switch (direction) {
        case 'left':
          mockImageUrl = `${protocol}://${host}/mock-bria/expanded-left.jpg`;
          break;
        case 'right':
          mockImageUrl = `${protocol}://${host}/mock-bria/expanded-right.jpg`;
          break;
        case 'top':
          mockImageUrl = `${protocol}://${host}/mock-bria/expanded-top.jpg`;
          break;
        case 'bottom':
        default:
          mockImageUrl = `${protocol}://${host}/mock-bria/expanded-bottom.jpg`;
          break;
      }
      
      return NextResponse.json({
        success: true,
        result_url: mockImageUrl,
        method: 'mock-response',
        mock: true
      });
    }

    // Auth headers for BRIA API
    const authHeaders = {
      'X-API-KEY': briaKey,
    };

    // Approach 1: Try direct FormData upload with axios
    try {
      console.log('🔍 Attempting Approach 1: Direct FormData upload with axios...');
      
      // Create a Node.js FormData object
      const directFormData = new FormData();
      
      // Convert File to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      directFormData.append('image', buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      directFormData.append('direction', direction);
      
      if (prompt) {
        directFormData.append('prompt', prompt);
      }
      
      directFormData.append('num_results', '1');
      directFormData.append('sync', 'true');

      const directUrl = `${briaUrl}/expand`;
      
      console.log('Making request to:', directUrl);
      
      const axiosResponse = await axios.post(directUrl, directFormData, {
        headers: {
          ...authHeaders,
          ...directFormData.getHeaders(),
        },
      });
      
      console.log('Response status:', axiosResponse.status);
      console.log('Response data:', axiosResponse.data);
      
      if (axiosResponse.status >= 200 && axiosResponse.status < 300 && axiosResponse.data?.results?.[0]?.url) {
        console.log('✅ Approach 1 succeeded!');
        return NextResponse.json({
          success: true,
          result_url: axiosResponse.data.results[0].url,
          method: 'direct-formdata-axios'
        });
      } else {
        console.log('❌ Approach 1 failed');
        // Continue to next approach
      }
    } catch (err: any) {
      console.error('Approach 1 error:', err.message);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      // Continue to next approach
    }

    // Approach 2: Register + Expand approach with axios
    try {
      console.log('🔍 Attempting Approach 2: Register + Expand with axios...');
      
      // Step 1: Register the image to get a visual_id
      const registerFormData = new FormData();
      
      // Convert File to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      registerFormData.append('image', buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      registerFormData.append('response_type', 'json');
      
      const registerUrl = `${briaUrl}/register`;
      
      const registerResponse = await axios.post(registerUrl, registerFormData, {
        headers: {
          ...authHeaders,
          ...registerFormData.getHeaders(),
        },
      });
      
      console.log('Register response:', registerResponse.data);
      
      if (!registerResponse.data?.visual_id) {
        throw new Error('Register failed: no visual_id returned');
      }
      
      console.log(`✅ Register succeeded with visual_id: ${registerResponse.data.visual_id}`);
      const visualId = registerResponse.data.visual_id;

      // Step 2: Use the visual_id for expansion
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

      const expandUrl = `${briaUrl}/expand`;
      
      const expandResponse = await axios.post(expandUrl, expansionData, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Expand response:', expandResponse.data);

      if (expandResponse.status >= 200 && expandResponse.status < 300 && expandResponse.data?.results?.[0]?.url) {
        console.log('✅ Approach 2 succeeded!');
        return NextResponse.json({
          success: true,
          result_url: expandResponse.data.results[0].url,
          method: 'register-expand-axios'
        });
      } else {
        console.log('❌ Approach 2 failed');
        throw new Error('Expand failed');
      }
    } catch (err: any) {
      console.error('Approach 2 error:', err.message);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      // Continue to next approach
    }

    // Approach 3: Try direct binary upload as a fallback with axios
    try {
      console.log('🔍 Attempting Approach 3: Direct binary upload with axios...');
      
      // Convert File to ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Add query parameters to URL
      const queryParams = new URLSearchParams({
        direction,
        num_results: '1',
        sync: 'true',
      });
      
      if (prompt) {
        queryParams.set('prompt', prompt);
      }
      
      const binaryUrl = `${briaUrl}/expand?${queryParams.toString()}`;
      
      const binaryResponse = await axios.post(binaryUrl, buffer, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/octet-stream',
        },
      });
      
      console.log('Binary response:', binaryResponse.data);

      if (binaryResponse.status >= 200 && binaryResponse.status < 300 && binaryResponse.data?.results?.[0]?.url) {
        console.log('✅ Approach 3 succeeded!');
        return NextResponse.json({
          success: true,
          result_url: binaryResponse.data.results[0].url,
          method: 'binary-upload-axios'
        });
      } else {
        console.log('❌ Approach 3 failed');
      }
    } catch (err: any) {
      console.error('Approach 3 error:', err.message);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
    }

    // Approach 4: Try the /register endpoint directly with all parameters
    try {
      console.log('🔍 Attempting Approach 4: Using /register endpoint with all parameters...');
      
      const fullRegisterFormData = new FormData();
      
      // Convert File to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      fullRegisterFormData.append('image', buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      fullRegisterFormData.append('direction', direction);
      
      if (prompt) {
        fullRegisterFormData.append('prompt', prompt);
      }
      
      fullRegisterFormData.append('num_results', '1');
      fullRegisterFormData.append('sync', 'true');
      fullRegisterFormData.append('response_type', 'json');
      
      const registerUrl = `${briaUrl}/register`;
      
      const registerResponse = await axios.post(registerUrl, fullRegisterFormData, {
        headers: {
          ...authHeaders,
          ...fullRegisterFormData.getHeaders(),
        },
      });
      
      console.log('Full register response:', registerResponse.data);

      if (registerResponse.status >= 200 && registerResponse.status < 300 && registerResponse.data?.results?.[0]?.url) {
        console.log('✅ Approach 4 succeeded!');
        return NextResponse.json({
          success: true,
          result_url: registerResponse.data.results[0].url,
          method: 'register-full-axios'
        });
      } else {
        console.log('❌ Approach 4 failed');
      }
    } catch (err: any) {
      console.error('Approach 4 error:', err.message);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
    }

    // If we get here, all approaches failed
    return NextResponse.json(
      { error: 'All API approaches failed, see server logs for details' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in /api/test-bria route:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 