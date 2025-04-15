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
    if ((data.version && data.version.includes('flux-dev-lora-trainer') && data.status === 'succeeded') ||
        (data.version && data.version.includes('lora-training') && data.status === 'succeeded') ||
        (data.version && data.version.includes('sdxl-finetuner') && data.status === 'succeeded')) {
      try {
        console.log('Model training completed:', data.id);
        
        // Extract the trained model URL and details from the output
        // Support multiple training model output formats
        let trainedModelUrl, trainedModelVersion, modelKeyword;
        
        if (data.version.includes('flux-dev-lora-trainer')) {
          // Flux trainer format
          trainedModelUrl = data.output?.model;
          trainedModelVersion = data.output?.version;
          modelKeyword = data.input?.caption_prefix || data.input?.name;
        } else if (data.version.includes('lora-training')) {
          // Standard lora-training format
          trainedModelUrl = data.output?.lora;
          trainedModelVersion = "latest";
          modelKeyword = data.input?.trigger_word;
        } else if (data.version.includes('sdxl-finetuner')) {
          // SDXL finetuner format
          trainedModelUrl = data.output?.fine_tuned_model || data.output?.lora;
          trainedModelVersion = "latest";
          modelKeyword = data.input?.caption || data.input?.input_name;
        }
        
        if (trainedModelUrl) {
          console.log('Trained model URL:', trainedModelUrl);
          console.log('Trained model version:', trainedModelVersion);
          
          // Store the trained model information in the database via API
          const modelData = {
            id: data.id,
            model_url: trainedModelUrl,
            version: trainedModelVersion,
            status: 'ready',
            created_at: new Date().toISOString(),
            input_parameters: data.input,
            // Extract model name from the input parameters
            name: data.input?.name || data.input?.destination || data.input?.input_name || 'Custom Model',
            description: data.input?.model_description || `Custom trained model for ${data.input?.input_name || 'user'}`,
            keyword: modelKeyword,
          };
          
          console.log('Saving model data:', modelData);
          
          // Save this data to our models API
          try {
            const saveResponse = await fetch(new URL('/api/models/save', req.nextUrl.origin).toString(), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(modelData),
            });
            
            if (!saveResponse.ok) {
              throw new Error(`Failed to save model data: ${saveResponse.status}`);
            }
            
            console.log('Model data saved successfully');
          } catch (saveError) {
            console.error('Error saving model data:', saveError);
          }
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