#!/bin/bash

# Cloud Run Deployment Script for The Way AI Backend
set -e

# Configuration
PROJECT_ID="gen-lang-client-0504403402"
SERVICE_NAME="theway-ai-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying The Way AI Backend to Google Cloud Run..."

# Step 1: Build and push the Docker image
echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME .

echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

# Step 2: Deploy to Cloud Run
echo "🌍 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 3600s \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 10

echo "✅ Deployment completed!"
echo "🔗 Your service URL:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'

echo ""
echo "📝 Next steps:"
echo "1. Set your environment variables using: gcloud run services update $SERVICE_NAME --set-env-vars KEY=VALUE"
echo "2. Update your frontend to use the new Cloud Run URL"
echo "3. Test your endpoints at the URL above" 