/**
 * Test script to verify Google Vertex AI Imagen API integration
 * 
 * Run with: node -r dotenv/config scripts/test-imagen.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testVertexAI() {
  console.log('Starting Vertex AI test...');
  console.log('Environment variables:');
  console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID);

  try {
    const fs = require('fs');
    
    // Check if credentials file exists
    if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      console.error('Credentials file not found:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
      return;
    }
    
    console.log('Credentials file exists, attempting to parse...');
    
    // Read and parse credentials
    const credentialContent = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    const credentials = JSON.parse(credentialContent);
    console.log('Credentials parsed successfully');
    console.log('- Service account email:', credentials.client_email);
    console.log('- Project ID from credentials:', credentials.project_id);
    
    // Import the Vertex AI module
    const { VertexAI } = require('@google-cloud/vertexai');
    
    // Initialize Vertex AI
    console.log('Initializing Vertex AI...');
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_PROJECT_ID,
      location: 'us-central1',
    });
    
    // Get the generative model
    console.log('Getting generative model...');
    const model = vertexAI.preview.getGenerativeModel({
      model: 'imagegeneration@002',
      generationConfig: {}
    });
    
    // Generate an image
    console.log('Generating image...');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'A cute cat wearing a hat' }] }]
    });
    
    console.log('Response received:');
    console.log(JSON.stringify(result.response, null, 2));
    
    // Check if images were generated
    if (result.response.candidates && 
        result.response.candidates.length > 0 && 
        result.response.candidates[0].content && 
        result.response.candidates[0].content.parts) {
      
      const parts = result.response.candidates[0].content.parts;
      const images = parts.filter(part => part.inlineData && part.inlineData.data);
      
      console.log(`Images generated: ${images.length}`);
      
      if (images.length > 0) {
        // Success!
        console.log('Success! Imagen API is working correctly.');
        
        // Save the first image to a file so you can view it
        const imageData = images[0].inlineData.data;
        fs.writeFileSync('test-image.png', Buffer.from(imageData, 'base64'));
        console.log('Image saved as test-image.png');
      } else {
        console.error('No images found in the response parts');
      }
    } else {
      console.error('No valid response structure detected');
    }
  } catch (error) {
    console.error('Error testing Vertex AI:', error);
  }
}

testVertexAI(); 