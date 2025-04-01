# Google Vertex AI Imagen Setup Guide

This document provides detailed instructions for setting up Google Vertex AI Imagen integration with The Way platform.

## Overview

Google Vertex AI Imagen is a powerful image generation model that can create high-quality images from text prompts. The implementation uses the official Google Cloud Vertex AI client library for Node.js.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Billing enabled on your GCP account
- Basic familiarity with GCP console

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name and click "Create"
5. Wait for the project to be created and then select it

### 2. Enable the Vertex AI API

1. Navigate to "APIs & Services" > "Library" in the Google Cloud Console
2. Search for "Vertex AI API"
3. Click on the API and then click "Enable"

### 3. Create a Service Account

1. Navigate to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a service account name (e.g., "imagen-access")
4. Click "Create and Continue"
5. Add the following roles:
   - "Vertex AI User"
   - "Storage Object Viewer" (if you plan to store the generated images)
6. Click "Continue" and then "Done"

### 4. Generate a Service Account Key

1. On the Service Accounts page, find the service account you just created
2. Click on the three dots in the "Actions" column
3. Click "Manage keys"
4. Click "Add Key" > "Create new key"
5. Choose "JSON" and click "Create"
6. The key file will be downloaded to your computer

### 5. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Cloud Authentication
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
GOOGLE_PROJECT_ID=your-project-id
```

If you're using a relative path for the credentials file, make sure it's relative to the project root.

For example, if your credentials file is in the project root:

```bash
GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json
GOOGLE_PROJECT_ID=your-project-id
```

### 6. Install Required Dependencies

Install the Google Cloud Vertex AI client library:

```bash
npm install @google-cloud/vertexai
```

### 7. API Implementation

The application uses the Vertex AI Generative Models API for image generation. The implementation follows Google's recommended approach:

```javascript
// Import and initialize the Vertex AI client
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI with your project and location
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID,
  location: 'us-central1', // Imagen is available in us-central1
});

// Get the generative model (Imagen)
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: 'imagegeneration@002', // Using Imagen model
});

// Generate an image
const result = await generativeModel.generateContent({
  contents: [{ role: 'user', parts: [{ text: 'Your prompt here' }] }]
});

// Extract the generated image
const response = result.response;
if (response.candidates && response.candidates.length > 0) {
  const parts = response.candidates[0].content.parts;
  const images = parts.filter(part => part.inlineData && part.inlineData.data);
  // Images will be available as base64 data
}
```

### 8. Testing Your Configuration

After setting up your environment variables and installing dependencies, restart your development server with:

```bash
npm run dev
```

Navigate to the Test Model page at `/models/test` to verify that your credentials are being detected properly. The application will show a confirmation message when your credentials are correctly configured.

## Troubleshooting

### Common Error: Authentication Failed

Make sure your service account key file is correctly referenced in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable and that the service account has the necessary permissions.

### Common Error: API Not Enabled

Ensure that the Vertex AI API is enabled for your project in the Google Cloud Console.

### Common Error: Billing Not Enabled

Vertex AI requires billing to be enabled on your Google Cloud project.

### Common Error: File Path Issues

If using a relative path for credentials, ensure you're running the server from the correct directory. The path should be relative to where you start the server.

### Check Environment Variables

You can run the environment check script to verify your credentials are properly configured:

```bash
node -r dotenv/config scripts/check-env.js
```

## Additional Resources

- [Google Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Vertex AI Generative AI Image Generation Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [Google Cloud Authentication Guide](https://cloud.google.com/docs/authentication/getting-started)

## Need Help?

For detailed troubleshooting information, see [IMAGEN_ERRORS.md](./IMAGEN_ERRORS.md) for common error messages and their solutions. 