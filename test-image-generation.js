// test-image-generation.js
// Simple script to test image generation with our trained model

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Model ID and prompt
const modelId = process.argv[2] || 'ma3ieno1ye86'; // Default to the model we trained
const prompt = process.argv[3] || 'a photo of sks test object in a field of flowers'; // Default prompt

// Test configuration
const numInferenceSteps = 30;
const guidanceScale = 7.5;
const negativePrompt = 'ugly, blurry, low quality, distorted';

async function testImageGeneration() {
  console.log(`Testing image generation for model ${modelId} with prompt: "${prompt}"`);
  
  try {
    // Call the API endpoint
    const response = await axios.post('http://localhost:3002/api/modal/generate-image', {
      modelId,
      prompt,
      numInferenceSteps,
      guidanceScale,
      negativePrompt,
    });
    
    // The response data is already parsed
    const result = response.data;
    
    if (result.status === 'error') {
      throw new Error(result.error || 'Unknown error occurred');
    }
    
    console.log('Image generation successful!');
    
    // If we have a base64 image, save it to a file
    if (result.image_base64) {
      const imageBuffer = Buffer.from(result.image_base64, 'base64');
      const outputPath = path.join(__dirname, 'generated_image.png');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`Image saved to: ${outputPath}`);
    } else if (result.imageUrl) {
      console.log(`Image URL: ${result.imageUrl}`);
    }
    
    // Print full response for debugging
    console.log('\nAPI Response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error generating image:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testImageGeneration(); 