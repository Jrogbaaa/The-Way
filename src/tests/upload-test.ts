/**
 * Simple test script for the gallery upload API
 * 
 * To run:
 * 1. Make sure the dev server is running
 * 2. Run this script with ts-node: npx ts-node src/tests/upload-test.ts
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_URL = 'http://localhost:3000/api/gallery/upload';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg'); // Add a test image to this directory

// Test with authentication token (replace with an actual token)
const AUTH_TOKEN = 'YOUR_SUPABASE_AUTH_TOKEN';

async function testUpload() {
  console.log('Starting upload test...');

  try {
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`Test image not found at ${TEST_IMAGE_PATH}`);
      return;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    form.append('pathPrefix', 'test-folder/');

    console.log('Sending request to:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form as any,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', data);

    if (response.ok) {
      console.log('Upload test successful!');
    } else {
      console.error('Upload test failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testUpload(); 