# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying "The Way" application to Vercel with all features working correctly, including auto-save functionality for generated images.

## Prerequisites

- GitHub account
- Vercel account (can sign up with GitHub)
- All required API keys and credentials as listed in this guide
- Google OAuth credentials properly configured

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

### 3. Environment Variables (Critical for Auto-Save)

Set up all required environment variables in the Vercel dashboard. **These are essential for auto-save functionality to work:**

1. Go to the project settings
2. Navigate to the "Environment Variables" tab
3. Add all the variables listed below

#### Required Environment Variables for Auto-Save

**Authentication & Session Management:**
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Set to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_APP_URL` - Set to your Vercel deployment URL (should match NEXTAUTH_URL)

**Google OAuth (Required for user authentication):**
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret

**Supabase (Required for file storage):**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

#### Additional Environment Variables

**API Keys:**
- `REPLICATE_API_TOKEN` - For AI image generation
- `GEMINI_API_KEY` - For Google Gemini API access
- `GOOGLE_API_KEY` - For other Google services

**Optional Services:**
- `BRIA_AI_API_KEY` - For Bria AI services
- `HUGGING_FACE_API_KEY` - For Hugging Face models
- `RUNWAY_API_KEY` - For Runway ML video services
- `D_ID_API_KEY` - For D-ID video services

### 4. Google OAuth Setup (Required for Auto-Save)

Auto-save functionality requires users to be authenticated via Google OAuth. Follow these steps:

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Configure OAuth Consent Screen:**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Configure your app information
   - Add your domain to authorized domains

3. **Create OAuth Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Web application"

4. **Configure Authorized URLs:**
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for development)
     - `https://your-vercel-domain.vercel.app` (for production)
   
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (for production)

5. **Copy Credentials:**
   - Copy the generated Client ID and Client Secret
   - Add them to your Vercel environment variables

### 5. Google Cloud Credentials

For Google Cloud services (Vertex AI, Vision API), handle credentials for Vercel:

1. Base64 encode your Google credentials file:
   ```bash
   cat google-credentials.json | base64
   ```

2. Copy the entire output string
3. Add as `GOOGLE_CLOUD_VISION_CREDENTIALS` environment variable in Vercel

### 6. Deploy and Validate

1. **Deploy:**
   - Click "Deploy" in the Vercel dashboard
   - Wait for the build to complete

2. **Validate Auto-Save Configuration:**
   ```bash
   # Run the validation script locally with production env vars
   node scripts/validate-auto-save-env.js
   ```

3. **Test Auto-Save Functionality:**
   - Visit your deployed application
   - Sign in with Google
   - Generate an image using any AI tool
   - Check that images are automatically saved to your gallery

### 7. Troubleshooting Auto-Save Issues

If auto-save isn't working:

#### Check Environment Variables
```bash
# Run the validation script
node scripts/validate-auto-save-env.js
```

#### Common Issues and Solutions

1. **"Authentication failed" errors:**
   - Verify `NEXTAUTH_SECRET` is set and secure
   - Check `NEXTAUTH_URL` matches your deployment URL
   - Ensure Google OAuth credentials are correct

2. **"Session not detected" errors:**
   - Verify `NEXT_PUBLIC_APP_URL` is set correctly
   - Check that both `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` point to the same domain

3. **"Storage bucket not found" errors:**
   - Verify all Supabase environment variables are set
   - Check that the `gallery-uploads` bucket exists in Supabase
   - Ensure RLS policies are configured correctly

4. **Images not saving despite being authenticated:**
   - Check Vercel function logs for specific error messages
   - Verify `SUPABASE_SERVICE_ROLE_KEY` has the correct permissions

#### Checking Logs in Vercel

1. Go to your Vercel project dashboard
2. Navigate to the "Functions" tab
3. Click on any API function to see logs
4. Look for auto-save related error messages

### 8. Set Up Custom Domain (Optional)

1. Go to project settings in Vercel
2. Navigate to the "Domains" tab
3. Add your custom domain
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to use the custom domain

### 9. Continuous Deployment

Vercel automatically deploys when you push to your main branch. Auto-save functionality will be maintained across deployments as long as environment variables are properly configured.

## Environment-Specific Configuration

For different environments (production, preview, development):

1. Go to project settings
2. Navigate to the "Environment Variables" tab
3. Use the dropdown to select which environment each variable applies to
4. Ensure production and preview environments have all required variables

## Security Best Practices

1. **Never commit sensitive environment variables to Git**
2. **Use strong, unique secrets for `NEXTAUTH_SECRET`**
3. **Regularly rotate API keys and secrets**
4. **Restrict Google OAuth to authorized domains only**
5. **Use Supabase RLS policies to secure user data**

## Monitoring Auto-Save Functionality

### Health Check Endpoint

Use the built-in health check to verify configuration:
```
GET https://your-app.vercel.app/api/health
```

This endpoint shows:
- Database connectivity status
- Environment variable status
- Service availability

### User Experience Indicators

When auto-save is working correctly:
- Users see "Images are automatically saved to your gallery" message
- Generated images appear in the user's gallery immediately
- No manual save action is required

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)

## Getting Help

If you continue to experience issues:

1. Run the validation script: `node scripts/validate-auto-save-env.js`
2. Check Vercel function logs for specific errors
3. Verify Supabase bucket configuration and RLS policies
4. Test authentication flow manually 