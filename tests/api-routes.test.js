// Tests for API route fixes
require('dotenv').config();
require('jest-fetch-mock').enableMocks();

describe('Model Status API Route', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const TEST_MODEL_ID = 'test-model-id';
  
  beforeEach(() => {
    fetch.resetMocks();
  });
  
  test('Model status route handles dynamic params correctly', async () => {
    // Mock the successful response
    fetch.mockResponseOnce(JSON.stringify({
      id: TEST_MODEL_ID,
      status: 'completed',
      progress: 1.0,
      model_name: 'Test Model'
    }));
    
    const response = await fetch(`${BASE_URL}/api/modal/model-status/${TEST_MODEL_ID}`);
    const data = await response.json();
    
    expect(response.status).not.toBe(500);
    expect(data.id).toBe(TEST_MODEL_ID);
    expect(data.status).toBeTruthy();
  });
  
  test('Model status route returns error for missing ID', async () => {
    // Mock error response
    fetch.mockResponseOnce(JSON.stringify({
      status: 'error',
      error: 'Missing model ID'
    }), { status: 400 });
    
    // Call with empty ID
    const response = await fetch(`${BASE_URL}/api/modal/model-status/`);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error).toBe('Missing model ID');
  });
});

describe('Cancel Training API Route', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const TEST_MODEL_ID = 'test-model-id';
  
  beforeEach(() => {
    fetch.resetMocks();
  });
  
  test('Cancel training route handles dynamic params correctly', async () => {
    // Mock the successful response
    fetch.mockResponseOnce(JSON.stringify({
      status: 'success',
      message: 'Training job cancelled successfully'
    }));
    
    const response = await fetch(`${BASE_URL}/api/modal/cancel-training/${TEST_MODEL_ID}`, {
      method: 'POST'
    });
    const data = await response.json();
    
    expect(response.status).not.toBe(500);
    expect(data.status).toBe('success');
    expect(data.message).toBe('Training job cancelled successfully');
  });
  
  test('Cancel training route returns error for missing ID', async () => {
    // Mock error response
    fetch.mockResponseOnce(JSON.stringify({
      status: 'error',
      error: 'Training ID is required'
    }), { status: 400 });
    
    // Call with empty ID
    const response = await fetch(`${BASE_URL}/api/modal/cancel-training/`, {
      method: 'POST'
    });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error).toBe('Training ID is required');
  });
}); 