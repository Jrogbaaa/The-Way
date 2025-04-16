import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

// Initialize Replicate client using the environment variable directly
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Check configuration directly from the environment variable
const isConfigured = !!process.env.REPLICATE_API_TOKEN;

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
 * API Route: GET /api/models
 * Retrieves a list of models owned by the authenticated user.
 */
export async function GET(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: 'Server configuration error: Replicate API token missing' }, 
      { status: 500 }
    );
  }

  try {
    // Assuming the Replicate client implicitly handles authentication
    // based on the provided API token.
    const models = await replicate.models.list(); // Correct call to list models
    return NextResponse.json(models, { status: 200 });
  } catch (error: any) {
    console.error('Error retrieving models:', error);
    const detail = error.response?.data?.detail || 'An unknown error occurred';
    const status = error.response?.status || 500;
    return NextResponse.json({ detail }, { status });
  }
}

/**
 * API Route: POST /api/models
 * Creates a new Replicate model.
 */
export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: 'Server configuration error: Replicate API token missing' }, 
      { status: 500 }
    );
  }

  try {
    const { owner, name, visibility, hardware, description, cover_image_url, paper_url, github_url } = await request.json();

    if (!owner || !name || !visibility || !hardware) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Correct call to create a model using separate arguments
    const model = await replicate.models.create(
      owner, 
      name, 
      {
        visibility,
        hardware,
        description,
        cover_image_url,
        paper_url,
        github_url
      }
    );

    return NextResponse.json(model, { status: 201 });

  } catch (error: any) {
    console.error('Error creating model:', error);
    const detail = error.response?.data?.detail || 'An unknown error occurred';
    const status = error.response?.status || 500;
    return NextResponse.json({ detail }, { status });
  }
} 