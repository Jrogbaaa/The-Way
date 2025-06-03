#!/bin/bash

# Environment Variables Setup for Cloud Run
# Update these values with your actual configuration

PROJECT_ID="gen-lang-client-0504403402"
SERVICE_NAME="theway-ai-backend"
REGION="us-central1"

echo "🔧 Setting up environment variables for Cloud Run..."

# Get environment variables from parent directory .env file
source ../.env.local

# Deploy environment variables
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --set-env-vars \
"NODE_ENV=production,\
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL,\
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,\
REPLICATE_API_TOKEN=$REPLICATE_API_TOKEN,\
FRONTEND_URL=https://your-vercel-domain.vercel.app"

echo "✅ Environment variables updated!"
echo "🔗 Service URL:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' 