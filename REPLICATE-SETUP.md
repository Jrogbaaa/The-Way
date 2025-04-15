# Setting Up Model Training with Replicate

This guide explains how to set up Replicate for custom model training and generate images with trained models in The Way application.

## Prerequisites

1. A Replicate account with API access
2. A Supabase account with a project set up

## Environment Setup

1. Copy the values from `.env.example` to `.env` and fill in your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Replicate API Configuration
REPLICATE_API_TOKEN=your-replicate-api-token
# Leave commented out for local development - we use polling instead
# REPLICATE_WEBHOOK_URL=your-webhook-url/api/webhook/replicate

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3006
```

## Database Setup

1. Create the required tables in your Supabase project by running the SQL script provided in `scripts/setup-supabase.sql`:

```sql
-- Create trained_models table
CREATE TABLE IF NOT EXISTS trained_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  model_url TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  keyword TEXT,
  input_parameters JSONB,
  category TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  replicate_id TEXT,
  last_used TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT
);

-- Create necessary indexes and policies
-- ... (the rest of the script)
```

## How Model Training Works Without Webhooks

In local development, we use a polling mechanism instead of webhooks:

1. User uploads training images via the Create Model page at `/models/create`
2. The app sends the images and parameters to Replicate's LoRA trainer
3. Replicate processes the training job asynchronously
4. The client polls the `/api/models/status` endpoint every 10 seconds to check on job status
5. When the status endpoint detects a completed job, it saves the model data to Supabase
6. The UI updates to show the completed model

If you want to use webhooks in production:

1. Set up a public HTTPS endpoint (e.g., using ngrok in development or your production domain)
2. Uncomment and set `REPLICATE_WEBHOOK_URL` in your `.env` file
3. The webhook handler will automatically save model data when training completes

## Debugging

If you're experiencing issues:

1. Check the console logs for error messages
2. Verify your Replicate API token is correct and has sufficient permissions
3. Check the Replicate dashboard for the status of your training jobs
4. Verify the Supabase connection and permissions
5. Check the Network tab in Developer Tools to see API responses

## Creating a Model 

1. Go to the Create Model page (`/models/create`)
2. Fill in the model details (name, description, category)
3. Upload at least 10-20 high-quality images for best results (supports .zip files)
4. Configure training parameters (epochs, learning rate, batch size)
5. Click "Create Model" to start the training process
6. Monitor the progress on the page
7. Once training is complete, you can use your model from the Models page

## Using Trained Models

Once a model is trained, you can use it for image generation by:

1. Going to the Models page
2. Selecting your trained model
3. Entering a prompt that includes the keyword associated with your model
4. Generating images that incorporate your model's style or subject

## Technical Details

Key files:
- `src/app/models/create/page.tsx` - Frontend for model creation
- `src/app/api/models/train/route.ts` - API endpoint for starting model training
- `src/app/api/models/status/route.ts` - API endpoint for checking training status
- `src/app/api/models/save/route.ts` - API endpoint for saving model data
- `src/app/api/webhook/replicate/route.ts` - Webhook handler for production use 

## Flux LoRA Model Training

The application now supports training custom models using Flux LoRA technology. To use this feature:

1. Navigate to the `/models/create` page
2. Enter a model name and trigger word
3. Upload a ZIP file containing 10-30 training images
4. Click "Create Model"

### Troubleshooting Model Training

If you encounter a "Failed to fetch" error when creating models, follow these steps:

1. **Check Replicate API Connection**:
   - Use the "Check Replicate Connection" button to verify connectivity to the Replicate API
   - Ensure your Replicate API token is valid and configured in `.env` or `.env.local`

2. **Verify Network Connectivity**:
   - Make sure your development server can reach `https://api.replicate.com/`
   - Check for any CORS issues if you're running in a browser environment

3. **File Size Limitations**:
   - Your training ZIP file should be under 50MB for optimal performance
   - Include 10-30 high-quality images in your training set

### API Integration

The application uses the following API endpoints for model training:

- `POST /api/models/train-flux` - Create a new Flux LoRA model with a ZIP file
- `GET /api/models/check-replicate` - Diagnostics endpoint to test Replicate API connectivity

### Environment Configuration

Ensure these environment variables are set:

```
# Required for Replicate API access
REPLICATE_API_TOKEN=your-token-here

# Optional webhook for training completion notifications
REPLICATE_WEBHOOK_URL=https://your-domain.com/api/webhook/replicate
```

The system will use fallback tokens in development, but a valid token is required for production. 