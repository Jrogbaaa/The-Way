# Social AI Agent Development Guide

## Overview

The Social AI Agent is a platform for optimizing social media content using AI. This guide covers development practices, architecture, and guidelines for maintaining and extending the codebase.

## Architecture

The application is built using:

- **NextJS** - React framework
- **TypeScript** - For type safety
- **TailwindCSS** - For styling
- **Google Vertex AI** - For image analysis
- **Google Gemini** - For social media expert chat functionality

### Directory Structure

```
the-way/
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── api/               # API endpoints
│   │   │   ├── imagen/        # Image generation API
│   │   │   ├── chat/          # Chat API for social media expert
│   │   ├── chat/              # Chat interface page
│   ├── components/            # React components
│   ├── lib/                   # Utility functions & API clients
│   │   ├── api/               # API integration code
│   │   │   ├── gemini.ts      # Google Gemini integration
│   │   │   ├── replicate.ts   # Replicate integration
│   │   │   ├── vision.ts      # Google Vision integration
│   │   ├── vertex.ts          # Google Vertex AI integration
│   ├── types/                 # TypeScript type definitions
│   └── public/                # Static assets
```

## Development Guidelines

### Type Safety

- Always define interfaces/types for component props and API responses
- Use type guards for union types (e.g., string | object)
- Import types from the central `types/index.ts` file

### Error Handling

- Use the error handling utilities in `lib/errorHandling.ts`
- Always handle API errors gracefully with fallbacks
- Implement client-side validation before API calls

### UI Components

- Follow Tailwind CSS best practices
- Make components responsive by default
- Ensure accessibility compliance (ARIA attributes, keyboard navigation)
- Maintain consistent UI patterns across the application

### API Integration

- Document API responses in `lib/api/README.md`
- Use the `safeApiCall` and `safeParseResponse` utilities
- Implement proper error handling for all API calls

### Adding New Features

1. Define types first in `types/index.ts`
2. Create/update API handlers if needed
3. Implement UI components
4. Add comprehensive error handling
5. Update documentation

### Testing

- Write tests for critical functionality
- Test edge cases and error scenarios
- Ensure all components handle loading, error, and success states

## Image Analysis Feature

The image analysis feature uses Google Vertex AI to:

1. Analyze images for content and suitability
2. Provide recommendations for social media optimization
3. Suggest platform fit and content improvements

### Key Files:

- `lib/vertex.ts` - Integration with Google Vertex AI
- `components/PostUploadForm.tsx` - UI for image upload and analysis
- `types/index.ts` - Type definitions for analysis results

### Analysis Response Structure

The image analysis returns data including:

- Safety analysis (adult, violence, medical, racy content)
- Content labels with confidence scores
- Face detection and analysis
- Social media potential assessment
- Platform recommendations
- Optimization tips

## Chat with Social Media Expert Feature

The social media expert chat feature uses Google Gemini to:

1. Provide expert advice on social media strategy across all major platforms
2. Offer content creation assistance for posts, captions, and hashtags
3. Help with audience engagement optimization and analytics interpretation
4. Suggest current trends and best practices

### Key Files:

- `lib/api/gemini.ts` - Integration with Google Gemini
- `app/api/chat/route.ts` - API endpoint for chat interactions
- `app/chat/page.tsx` - UI for chat interface
- `types/index.ts` - Type definitions for chat messages and sessions

### Chat Session Management

The chat feature maintains conversation context by:

- Storing chat history between messages
- Including a system prompt for the first message to set expertise context
- Properly handling chat session initialization and updates

### Implementation Details

- Uses the Google Generative AI library (`@google/generative-ai`)
- Configured with the Gemini Pro model for advanced reasoning
- Includes a comprehensive system prompt defining the agent's expertise
- Handles error states in the UI with fallback error messages

## Best Practices

### Code Organization

- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Group related functionality in dedicated modules

### Performance

- Optimize image sizes before upload
- Use Next.js image optimization
- Implement proper loading states for async operations

### Documentation

- Add JSDoc comments to functions and components
- Keep API documentation up-to-date
- Document complex logic and business rules

## Troubleshooting

### Common Issues

- **API errors**: Check network tab for response details
- **Type errors**: Ensure API responses match defined types
- **UI glitches**: Check browser console for React errors
- **Chat API errors**: Verify Gemini API key is correctly set in .env

### Debugging Tools

- Browser Developer Tools
- React Developer Tools
- Next.js debugging support

## Environment Variables

The application requires the following environment variables:

- `GEMINI_API_KEY` - Google Gemini API key for chat functionality
- `GOOGLE_API_KEY` - Google API key for other Google services
- `VERTEX_API_KEY` - Google Vertex AI API key
- `NEXT_PUBLIC_API_URL` - API base URL
- `REPLICATE_API_TOKEN` - Replicate API token for image generation

## Deployment

The application is deployed using Vercel. The deployment process is automated through GitHub integration.

### Environment Variables

Ensure all required environment variables are set in the deployment environment as listed above. 