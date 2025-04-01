# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying "The Way" application to Vercel.

## Prerequisites

- GitHub account
- Vercel account (can sign up with GitHub)
- All required API keys and credentials as listed in the `.env.example` file

## Deployment Steps

### 1. Push your code to GitHub

If you haven't already, push your codebase to a GitHub repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Log in to [Vercel](https://vercel.com/)
2. Click on "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Environment Variables

Set up all required environment variables in the Vercel dashboard:

1. Go to the project settings
2. Navigate to the "Environment Variables" tab
3. Add all the variables from your `.env.local` file

Important environment variables include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `REPLICATE_API_TOKEN`
- `GOOGLE_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_CLOUD_PROJECT_ID`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)

### 4. Google Cloud Credentials

For Google Cloud services (Vertex AI, Vision API), you need to handle the credentials in a special way for Vercel deployment:

1. Base64 encode your Google credentials file:
   ```bash
   cat google-credentials.json | base64
   ```

2. Copy the entire output string (it will be long)

3. Add this as `GOOGLE_CLOUD_VISION_CREDENTIALS` environment variable in Vercel

The application is configured to automatically decode this during runtime using the helper functions in `src/lib/credentials.ts`.

### 5. Deploy

1. Click "Deploy" in the Vercel dashboard
2. Vercel will build and deploy your application
3. Once complete, you'll receive a deployment URL

### 6. Set Up Custom Domain (Optional)

1. Go to the project settings in Vercel
2. Navigate to the "Domains" tab
3. Add your custom domain and follow the instructions to configure DNS

## Continuous Deployment

Vercel automatically deploys when you push to your main branch. To change this behavior:

1. Go to project settings
2. Navigate to the "Git" tab
3. Modify the "Production Branch" and deployment settings as needed

## Environment-Specific Configuration

For different environments (production, preview, development):

1. Go to project settings
2. Navigate to the "Environment Variables" tab
3. Use the dropdown to select which environment each variable applies to

## Troubleshooting

### Build Failures

1. Check the build logs in Vercel dashboard
2. Ensure all required environment variables are set
3. Verify that the Next.js configuration is Vercel-compatible

### Runtime Errors

1. Check the "Runtime Logs" in the Vercel dashboard
2. Verify that your Google credentials are properly encoded
3. Ensure all API keys are valid

### Google Credentials Issues

If you're experiencing issues with Google credentials:

1. Regenerate the service account key
2. Ensure it has all required permissions
3. Re-encode to base64 and update the environment variable in Vercel

## Monitoring and Analytics

Vercel provides built-in analytics and monitoring:

1. Go to the project dashboard
2. Navigate to the "Analytics" tab
3. View performance, errors, and usage metrics

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli) 