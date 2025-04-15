import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

// Initialize Replicate client
const replicate = new Replicate({
  auth: API_CONFIG.replicateApiToken,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    // Query to get models from Supabase
    let query = supabase.from('trained_models').select('*');
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // If no models found, return empty array with 200 status
    if (!data || data.length === 0) {
      // Provide some mock models for dev purposes
      const mockModels = [
        {
          id: 'mock-model-1',
          name: 'Sample Fashion Model',
          description: 'A model trained on fashion images',
          status: 'ready',
          category: 'Fashion',
          model_url: 'owner/fashion-model:latest',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          keyword: 'fashion-model'
        },
        {
          id: 'mock-model-2',
          name: 'Sample Landscape Model',
          description: 'A model trained on landscape images',
          status: 'ready',
          category: 'Landscape',
          model_url: 'owner/landscape-model:latest',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          keyword: 'landscape-model'
        }
      ];
      
      return NextResponse.json(mockModels);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
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