/**
 * Test script to verify Google authentication
 * 
 * Run with: node scripts/test-auth.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Google authentication test');
console.log('=========================');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID);

// Check if file exists
const fs = require('fs');
try {
  const fileExists = fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('Credentials file exists:', fileExists);
  
  if (fileExists) {
    // Read the file content
    const fileContent = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    const credentials = JSON.parse(fileContent);
    console.log('Credentials valid JSON:', true);
    console.log('Project ID in credentials:', credentials.project_id);
    console.log('Client email:', credentials.client_email);
  }
} catch (error) {
  console.error('Error checking credentials file:', error);
}

// Test authentication with Google Cloud
async function testAuth() {
  try {
    // Import the Vertex AI client
    const { VertexAI } = require('@google-cloud/vertexai');
    
    // Create a simple client to test authentication
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_PROJECT_ID,
      location: 'us-central1',
    });
    
    console.log('Successfully created Vertex AI client');
    
    // Try a simple operation to verify authentication
    const model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-1.0-pro',
    });
    
    console.log('Successfully initialized model');
    
    // Simple text generation to test authentication
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello, how are you?' }] }],
    });
    
    console.log('Successfully received response from Vertex AI');
    console.log('Authentication is working correctly!');
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Provide more detailed troubleshooting information
    if (error.message.includes('ENOENT')) {
      console.error('The credentials file could not be found. Make sure the path is correct.');
    } else if (error.message.includes('invalid_grant') || error.message.includes('Invalid JWT')) {
      console.error('The credentials appear to be invalid or expired.');
    } else if (error.message.includes('permission_denied')) {
      console.error('The service account does not have the necessary permissions.');
    }
  }
}

testAuth(); 