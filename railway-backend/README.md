# The Way AI Backend - Google Cloud Run

This is the AI backend service for The Way application, designed to run on Google Cloud Run with support for long-running AI model training operations.

## 🌟 Features

- **AI Model Training**: Handle Flux LoRA model training with Replicate
- **File Upload Processing**: Support for large training file uploads (up to 100MB)
- **Long-Running Operations**: Up to 60-minute timeouts for model training
- **Auto-Scaling**: Scales from 0 to handle traffic spikes
- **Cost-Effective**: Pay only for actual usage

## 🚀 Quick Start

### Prerequisites

1. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)
2. **Docker**: For building container images
3. **Google Cloud Project**: With billing enabled

### Setup Steps

1. **Clone and navigate to backend directory**:
   ```bash
   cd railway-backend
   ```

2. **Install Google Cloud CLI** (if not already installed):
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

3. **Enable required APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

4. **Configure Docker for Google Cloud**:
   ```bash
   gcloud auth configure-docker
   ```

5. **Update configuration**:
   - Edit `clouddeploy.sh` and update `PROJECT_ID`
   - Edit `setup-env.sh` with your actual environment variables

6. **Deploy to Cloud Run**:
   ```bash
   ./clouddeploy.sh
   ```

7. **Set environment variables**:
   ```bash
   ./setup-env.sh
   ```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `REPLICATE_API_TOKEN` | Replicate API token | ✅ |
| `FRONTEND_URL` | Your Vercel frontend URL | ✅ |
| `NODE_ENV` | Set to 'production' | ✅ |

## 📊 API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/models/train-flux` - Start Flux model training
- `GET /api/models/status/:id` - Check training status
- `POST /api/upload/training-images` - Upload training files
- `POST /api/webhooks/replicate` - Replicate webhook handler

## 💰 Cost Optimization

Google Cloud Run pricing:
- **Free Tier**: 2 million requests per month
- **Pay-per-use**: Only charged when processing requests
- **Auto-scaling**: Scales to zero when not in use

Typical costs for AI model training:
- Small models: $0.01-0.05 per training session
- Large models: $0.10-0.50 per training session

## 🔒 Security Features

- Non-root container execution
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet.js security headers
- Environment variable isolation

## 📈 Monitoring

Monitor your service:
```bash
# View logs
gcloud run logs tail $SERVICE_NAME --region $REGION

# Check service status
gcloud run services describe $SERVICE_NAME --region $REGION
```

## 🛠️ Development

Run locally:
```bash
npm install
npm run dev
```

Test with Docker:
```bash
docker build -t theway-ai-backend .
docker run -p 8080:8080 --env-file .env theway-ai-backend
```

## 🚀 Deployment Commands

```bash
# Initial deployment
./clouddeploy.sh

# Update environment variables
./setup-env.sh

# Redeploy after code changes
gcloud run deploy theway-ai-backend --source .

# Scale configuration
gcloud run services update theway-ai-backend \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1
```

## 🔗 Integration with Frontend

Update your Vercel frontend to use the Cloud Run URL:

```javascript
// In your frontend environment variables
NEXT_PUBLIC_AI_BACKEND_URL=https://your-service-url.run.app
```

## 🆘 Troubleshooting

Common issues:

1. **Build fails**: Ensure Docker is running and you're authenticated
2. **Environment variables**: Double-check values in `setup-env.sh`
3. **CORS errors**: Verify frontend URL in CORS configuration
4. **Timeout errors**: Model training can take 30+ minutes, this is normal

## 📞 Support

- Check logs: `gcloud run logs tail theway-ai-backend --region us-central1`
- Monitor metrics in Google Cloud Console
- Verify environment variables are set correctly 