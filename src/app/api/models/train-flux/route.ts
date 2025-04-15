import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { getReplicateClient } from '@/lib/replicate-client';
import type Replicate from 'replicate';

// Base URL for webhooks, will be auto-populated with the app's URL
const WEBHOOK_URL = API_CONFIG.appUrl || '';
// Max duration for the request (5 minutes)
const MAX_DURATION = 300;

// Define the webhook event types
type WebhookEventType = 'start' | 'output' | 'logs' | 'completed';

/**
 * Handles POST requests for model training
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Received train-flux request');
    
    // Parse form data
    const formData = await request.formData();
    
    // Extract training parameters
    const name = formData.get('name') as string;
    const keyword = formData.get('keyword') as string;
    const trainingData = formData.get('trainingData') as File;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }
    
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }
    
    if (!trainingData) {
      return NextResponse.json({ error: 'Training data is required' }, { status: 400 });
    }
    
    // Validate file is a zip
    if (!trainingData.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Training data must be a ZIP file' }, { status: 400 });
    }
    
    console.log(`Processing training file: ${trainingData.name} (${trainingData.size} bytes)`);
    
    // Convert file to base64
    const arrayBuffer = await trainingData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Get Replicate client
    const replicate = getReplicateClient();
    
    if (!replicate) {
      console.error('Failed to initialize Replicate client');
      return NextResponse.json({ error: 'Replicate API token is not configured' }, { status: 500 });
    }
    
    console.log('Replicate client initialized successfully');
    
    // Prepare input for the Flux model
    const trainingInput = {
      input: {
        prompt: keyword,
        instance_prompt: keyword,
        instance_data: {
          data: base64,
          format: "zip"
        },
        base_model: "FLUX-r",
        save_path: "results.tar",
        training_steps: 3000,
        learning_rate: 1e-4,
        train_batch_size: 4,
        use_8bit_adam: true,
        gradient_accumulation_steps: 4,
        lora_rank: 32, // Set lora_rank to 32 as specified
        timestamp: Date.now(),
        resolution: 1024,
        text_encoder_lr: 1e-5
      }
    };
    
    console.log('Starting model training with Flux...');
    
    try {
      // Use direct fetch API call with the correct structure
      console.log('Using direct API call to Replicate');
      
      // Prepare the request body with proper typing
      const requestBody: {
        version: string;
        input: any;
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
      } = {
        // Use a more accessible public Flux version
        version: "2b52459229a3e2d4574ece373a1fe04c51a4779661c553dfa0d33b579b50ea41",
        input: trainingInput.input,
      };
      
      // Only add webhook and webhook_events_filter if WEBHOOK_URL exists
      if (WEBHOOK_URL) {
        requestBody.webhook = `${WEBHOOK_URL}/api/webhook/replicate`;
        requestBody.webhook_events_filter = ["completed"] as WebhookEventType[];
        console.log('Using webhook URL:', WEBHOOK_URL);
      } else {
        console.log('No webhook URL provided, webhook configuration skipped');
      }
      
      // Use replicate client for prediction creation
      const prediction = await replicate.predictions.create({
        version: requestBody.version,
        input: requestBody.input,
        webhook: requestBody.webhook,
        webhook_events_filter: requestBody.webhook_events_filter,
      });
      
      console.log('Training started:', prediction.id);
      
      return NextResponse.json({
        id: prediction.id,
        status: prediction.status,
        model: name,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error training model:', error);
      return NextResponse.json({ 
        error: `Failed to start model training: ${error instanceof Error ? error.message : String(error)}`,
        details: 'An error occurred while communicating with Replicate API'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}`,
      details: 'An error occurred while processing your request'
    }, { status: 500 });
  }
}

/**
 * Get the MIME type based on file extension
 */
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Calculate width for a given height resolution while maintaining 16:9 aspect ratio
 */
function calculateWidth(height: number): number {
  return Math.round((height * 16) / 9);
} 