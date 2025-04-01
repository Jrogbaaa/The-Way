import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: API_CONFIG.replicateApiToken,
});

// TODO: In a production environment, you would store trained models in a database
// This is a simplified implementation using mock data
const TRAINED_MODELS = [
  {
    id: 'mock-model-1',
    name: 'Portrait Style Model',
    description: 'A model trained on portrait photography with natural lighting',
    version: 'user/portrait-style:abc123',
    model_url: 'https://replicate.com/user/portrait-style',
    status: 'active',
    created_at: '2023-04-15T10:30:00Z',
    thumbnail: 'https://placehold.co/300x300/e9f5ff/0099ff.png?text=Portrait+Model'
  },
  {
    id: 'mock-model-2',
    name: 'Fantasy Landscape',
    description: 'Generate magical fantasy landscapes',
    version: 'user/fantasy-landscape:def456',
    model_url: 'https://replicate.com/user/fantasy-landscape',
    status: 'active',
    created_at: '2023-05-20T14:45:00Z',
    thumbnail: 'https://placehold.co/300x300/fff5e9/ff9900.png?text=Fantasy+Model'
  }
];

/**
 * GET handler to list all trained models
 */
export async function GET(request: Request) {
  try {
    // Get search params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // In a real implementation, you would fetch models from your database
    // For example: const models = await db.models.list({ status });
    
    // Filter mock data by status if provided
    let models = [...TRAINED_MODELS];
    if (status) {
      models = models.filter(model => model.status === status);
    }
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error listing models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new model (without training)
 * This would be used for manually registering models
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, version, model_url, status, thumbnail } = body;
    
    if (!name || !version) {
      return NextResponse.json(
        { error: 'Name and version are required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would create a model in your database
    // For example: const model = await db.models.create({ name, description, version, model_url, status });
    
    // Mock response
    const model = {
      id: `model-${Date.now()}`,
      name,
      description,
      version,
      model_url,
      status: status || 'active',
      created_at: new Date().toISOString(),
      thumbnail: thumbnail || `https://placehold.co/300x300/e9f5ff/0099ff.png?text=${encodeURIComponent(name)}`
    };
    
    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 