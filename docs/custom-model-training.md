# Custom Model Training: "Create Images of You" (REMOVED)

> **⚠️ FEATURE REMOVAL NOTICE**: This feature has been removed from the application due to persistent technical issues causing page unresponsiveness and API reliability problems. This documentation is kept for historical and reference purposes only.

This document provides technical documentation for the "Create Images of You" feature that was previously implemented in TheWay.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Frontend Components](#frontend-components)
- [Backend API Endpoints](#backend-api-endpoints)
- [State Management](#state-management)
- [Configuration](#configuration)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [Troubleshooting](#troubleshooting)

## Overview

The "Create Images of You" feature allows users to:
1. Upload a ZIP file containing photos of a person
2. Name the model
3. Submit the form to create a "virtual model" with a unique trigger word
4. Use the trigger word to create personalized images

> **Note about implementation**: While we initially planned to use the `/trainings` endpoint of the Replicate API to actually train a custom LoRA model, the endpoint is currently returning 404 errors. As a temporary solution, we're using the `/predictions` endpoint to generate a sample image and create a "virtual model" with a unique trigger word. This allows us to demonstrate the UI flow and concept while we wait for the training API to become available.

## Architecture

The feature uses the following components:

1. **Frontend**: React components for file upload, model naming, and progress tracking
2. **Backend**: Next.js API route that handles:
   - File validation
   - Communication with Replicate API
   - Webhook handling for status updates
3. **State Management**: Zustand store for trained model data
4. **External Services**: Replicate.com API for image generation

## Frontend Components

The feature is implemented with the following React components:

1. `TrainModelForm`: Main component that handles file upload and form submission
2. `ModelTrainingStatus`: Shows the training/generation progress
3. `TrainedModelGallery`: Displays completed models and allows using them for generation

## Backend API Endpoints

### `/api/train-model`

This endpoint handles the creation of virtual models:

1. Validates the ZIP file URL and model name
2. Creates a unique trigger word based on the model name
3. Submits a request to Replicate's `/predictions` endpoint
4. Returns the prediction ID and trigger word for tracking

### `/api/model-webhook`

Handles webhook notifications from Replicate:

1. Receives updates when the prediction completes
2. Updates the model status in the store
3. Stores the sample image URL and metadata

## State Management

The feature uses a Zustand store `trainedModelsStore` to manage model data:

```typescript
interface TrainedModelsStore {
  trainedModels: TrainedModel[];
  addTrainedModel: (model: Omit<TrainedModel, 'id'>) => void;
  updateModelStatus: (id: string, status: ModelStatus, metadata?: any) => void;
  // Other actions...
}

interface TrainedModel {
  id: string;
  name: string;
  description: string;
  status: 'training' | 'ready' | 'failed' | 'external'; // Current state
  replicate_id?: string; // ID from Replicate
  category: string;
  metadata?: {
    triggerWord?: string; // Unique identifier for prompts
    modelType: 'virtual-model';
    sampleImageUrl?: string; // URL of the sample image
    virtualModel: true; // Flag indicating this is a virtual model
    // Other metadata...
  };
}
```

## Configuration

The feature requires the following environment variables:

- `REPLICATE_API_TOKEN`: Your API token for Replicate
- `NEXT_PUBLIC_APP_URL`: Public-facing URL for webhook callbacks (production only)

## Development Mode

In development mode, the feature works with some limitations:

1. Webhooks won't work (no public URL), so status updates rely on polling
2. File uploads need to be publicly accessible URLs

## Production Mode

In production:

1. Webhooks provide real-time status updates
2. Files can be uploaded to the server and stored temporarily

## Troubleshooting

Common issues and solutions:

1. **404 errors from Replicate API**: The trainings endpoint may not be available. The code automatically falls back to the predictions endpoint.
2. **Failed uploads**: Ensure the ZIP file URL is publicly accessible and properly formatted.
3. **Missing webhook updates**: Verify the `NEXT_PUBLIC_APP_URL` environment variable is set correctly.

## Future Implementation Notes

This section provides guidance for implementing the actual LoRA model training once the Replicate API's training endpoint becomes available again.

### Switching to Real Model Training

When the Replicate `/trainings` endpoint becomes available again, the application can be easily switched to use real model training with these changes:

1. In `src/app/api/train-model/route.ts`:
   - Change the POST endpoint from `/predictions` to `/trainings`
   - Update the input parameters to match the trainings API:
   ```javascript
   input: {
     input_images: finalZipFileUrl,
     trigger_word: triggerWord,
     steps: 1000,
     lora_rank: 32,
     resolution: "768", 
     autocaption: true,
     autocaption_prefix: `a photo of ${triggerWord}, `
   }
   ```

2. In `src/app/api/model-webhook/route.ts`:
   - Update the webhook handler to look for `output.weights` instead of image URLs
   - Update status codes from "virtual model" to actual trained model

3. Update the UI components to reflect training instead of virtual model creation

### Implementation Testing

To verify the training API is available again, you can run this test:

```javascript
try {
  const response = await fetch('https://api.replicate.com/v1/trainings', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${replicateApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "c6e78d2501e8088876e99ef21e4460d0dc121af7a4b786b9a4c2d75c620e300d",
      input: {
        input_images: "https://example.com/test.zip",
        trigger_word: "test_person",
        steps: 1000
      }
    }),
  });
  
  // If we get here without a 404, the API is available
  console.log('Training API is available again:', response.status);
} catch (error) {
  console.error('Training API test failed:', error);
}
``` 