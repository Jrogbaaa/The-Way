# Deployment Instructions for The Way

This document explains how to properly deploy the application to Vercel, ensuring all API tokens and environment variables are correctly set up.

## Prerequisites

1. A Vercel account connected to your GitHub repository
2. API tokens for all required external services

## Setting up Environment Variables in Vercel

1. Navigate to your project in the Vercel dashboard
2. Go to Settings > Environment Variables
3. Add the following environment variables:

### Required Environment Variables

- `REPLICATE_API_TOKEN`: Set this to `r8_W6YHRCBleZjPLLmfyrQiWseStHtumUo4TBMzb`
- `BRIA_AI_API_KEY`: Your Bria AI API key
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_APP_URL`: The URL of your deployed application

### Optional Environment Variables

- `GOOGLE_API_KEY`: For Google services
- `GEMINI_API_KEY`: For Gemini API access
- `HUGGING_FACE_API_KEY`: For Hugging Face API access
- `RUNWAY_API_KEY`: For Runway ML video services
- `D_ID_API_KEY`: For D-ID video services

## Deployment Settings

Make sure to set the following settings in your Vercel project:

1. Build Command: `npm run build`
2. Install Command: `npm install`
3. Output Directory: `.next`

## Troubleshooting

If you encounter issues with Serverless Function timeouts:

1. Ensure you're on a plan that allows longer execution times (Pro plan or higher for >10s)
2. Check that the `maxDuration` setting in `vercel.json` matches your plan limits
3. For the hobby plan, functions must have a `maxDuration` between 1 and 60 seconds

## After Deployment

After successful deployment:

1. Verify the application is working by testing core features
2. Check the deployment logs for any environment variable issues
3. Test API integrations to ensure all tokens are correctly set up 