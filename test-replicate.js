const Replicate = require('replicate');
require('dotenv').config();

// Initialize with the token from your .env file
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// The SDXL model ID
const modelId = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

// Test function
async function testReplicate() {
  console.log('Testing Replicate API...');
  try {
    console.log('Running model:', modelId);
    
    const output = await replicate.run(modelId, {
      input: {
        prompt: 'A dog running in the park',
        negative_prompt: '',
        width: 1024,
        height: 1024,
        num_outputs: 1,
        num_inference_steps: 25,
        guidance_scale: 7.5,
      }
    });
    
    console.log('Success! Output:', output);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testReplicate().catch(console.error); 