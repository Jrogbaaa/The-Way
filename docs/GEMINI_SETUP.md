# Google Gemini API Setup Guide

This guide provides step-by-step instructions for setting up the Google Gemini API for use with the Social Media Expert Chat feature.

## Prerequisites

- Google account
- Payment method for Google Cloud (for production use)
- The Way project cloned to your local environment

## Steps to Set Up Google Gemini API

### 1. Create or Access Google AI Studio

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. If it's your first time, complete the onboarding process

### 2. Get API Key

1. In Google AI Studio, click on "Get API key" or navigate to the API keys section
2. If you don't have an existing API key, click "Create API Key"
3. Give your API key a name (e.g., "Social AI Agent")
4. Copy the API key for use in the next step

### 3. Configure Environment Variables

1. In your project directory, locate the `.env.local` file (or create one if it doesn't exist)
2. Add the following line to the file:
   ```
   GEMINI_API_KEY=your-gemini-api-key
   ```
3. Replace `your-gemini-api-key` with the API key you copied in the previous step
4. Save the file

### 4. Install Required Dependencies

Ensure you have the necessary dependencies installed:

```bash
npm install @google/generative-ai
```

### 5. Verify Setup

To verify your Gemini API setup:

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Navigate to the Chat page in the application
3. Try sending a message to the social media expert
4. If you receive a coherent response, the setup is successful

## Understanding API Usage and Quotas

### Free Tier Limitations

The Google Gemini API offers a free tier with the following limitations:

- 60 queries per minute (QPM)
- Limited monthly quota (check AI Studio for current limits)
- Rate limiting may occur during peak usage

### Monitoring Usage

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to the "APIs & Services" section
3. Select "Gemini API" from the list
4. View your current usage and quota information

### Upgrading for Production

For production use with higher limits:

1. Set up a Google Cloud Platform billing account
2. Enable billing for the Gemini API
3. Consider setting up API key restrictions for security
4. Monitor usage to avoid unexpected costs

## Troubleshooting

### Common Issues

#### API Key Errors

If you receive "Invalid API key" errors:
- Verify the API key is correctly copied with no extra spaces
- Check that the environment variable is correctly named
- Try regenerating the API key in Google AI Studio

#### Rate Limiting

If you encounter rate limiting:
- Implement exponential backoff and retry logic
- Consider upgrading to a higher quota tier
- Optimize your application to reduce unnecessary API calls

#### Response Quality Issues

If responses don't match expectations:
- Review the system prompt in `lib/api/gemini.ts`
- Ensure you're using the Pro model for comprehensive responses
- Consider adjusting temperature and top-k parameters for better quality

## Advanced Configuration

### Model Selection

The Social Media Expert uses the following Gemini model:

```typescript
// Available in lib/api/gemini.ts
const proModel = genAI.getGenerativeModel({ model: AI_MODELS.gemini.pro });
```

You can modify the model selection based on your needs:
- `gemini-2.0-pro` - High-quality model for complex tasks
- `gemini-2.0-flash` - Faster model for simpler queries

### Generation Parameters

You can adjust generation parameters for different response characteristics:

```typescript
const chat = proModel.startChat({
  history: chatHistory?.history || [],
  generationConfig: {
    temperature: 0.7,     // Controls randomness (0.0-1.0)
    topK: 40,             // Limits vocabulary diversity
    topP: 0.95,           // Nucleus sampling parameter
    maxOutputTokens: 2048, // Maximum response length
  },
});
```

## Security Considerations

- Store API keys securely and never expose them in client-side code
- Set up API key restrictions in Google Cloud Console
- Consider implementing rate limiting in your application
- Validate and sanitize user input before sending to the API

## Additional Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api/rest/v1/models)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google AI Studio](https://ai.google.dev/) 