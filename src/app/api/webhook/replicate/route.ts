/**
 * Webhook handler for Replicate predictions
 * Handles status updates for model training and other async operations
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('Replicate webhook received:', JSON.stringify(data));

    // Verify this is a valid Replicate prediction status
    if (!data.id || !data.status) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Handle model training completion
    if (data.version && data.version.includes('flux-dev-lora-trainer') && data.status === 'succeeded') {
      try {
        console.log('LoRA model training completed:', data.id);
        
        // Extract the trained model URL and details from the output
        const trainedModelUrl = data.output?.model;
        const trainedModelVersion = data.output?.version;
        
        if (trainedModelUrl && trainedModelVersion) {
          console.log('Trained model URL:', trainedModelUrl);
          console.log('Trained model version:', trainedModelVersion);
          
          // TODO: Store the trained model information in your database
          // This could include saving to Supabase or other storage
          
          // Example of what you might store:
          const modelData = {
            id: data.id,
            model_url: trainedModelUrl,
            version: trainedModelVersion,
            status: 'active',
            created_at: new Date().toISOString(),
            input_parameters: data.input,
            // Extract model name from the input parameters
            name: data.input?.name || 'Custom LoRA Model',
            description: data.input?.model_description || 'Custom trained LoRA model',
          };
          
          console.log('Saving model data:', modelData);
          
          // Here you would actually save this data to your database
          // await db.models.create(modelData);
        }
      } catch (err) {
        console.error('Error processing training completion:', err);
      }
    }

    // Handle other prediction completion cases
    // Add other webhook handling logic here as needed
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 