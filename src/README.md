# Social AI Agent

A React/Next.js application for social media content creation and optimization using AI.

## Application Structure

### Key Directories

- `/app` - Next.js app router pages
  - `/api` - API endpoints
  - `/chat` - Social media expert chat interface
  - `/models` - Model showcase pages
- `/components` - Reusable React components
- `/lib` - Utility functions and API integrations
  - `/api` - API client integrations
    - `gemini.ts` - Google Gemini chat functionality
    - `vertex.ts` - Google Vertex AI image analysis
    - `replicate.ts` - Replicate image generation
- `/types` - TypeScript type definitions
- `/public` - Static assets

### Key Features

1. **AI Model Integration**
   - Custom model interaction (Cristina, Jaime)
   - Image generation capabilities
   - Social media content analysis

2. **Social Media Optimization**
   - Image analysis for content suitability
   - Engagement potential estimation
   - Platform-specific recommendations
   - Content optimization tips

3. **Social Media Expert Chat**
   - AI-powered social media expert
   - Platform-specific strategy advice
   - Content creation assistance
   - Analytics interpretation and optimization
   
4. **Multi-Model Support**
   - Text generation models
   - Image generation models
   - Content analysis models
   - Conversational AI models

## Implementation Details

### Image Analysis

The application uses Google Vertex AI for image analysis. Key aspects:

- Image uploads are analyzed for content and social media potential
- Results include safety analysis, content labels, and engagement predictions
- All image uploads are allowed (no restrictions) but recommendations are provided

### Social Media Expert Chat

The application uses Google Gemini for its conversational AI capabilities:

- Implements a social media expert persona with 10+ years of experience
- Provides platform-specific advice for major social networks
- Maintains conversation context for personalized responses
- Supports multi-turn dialogue with follow-up questions and clarifications
- Implements a comprehensive system prompt for expert domain knowledge

### AI Model Integration

The application supports multiple AI models:

- **Cristina** - Visual content creator for social media
- **Jaime** - Visual content analyst for social media
- **Gemini** - Conversational AI for social media expertise
- Ability to generate and analyze different types of content

### Error Handling

The application includes robust error handling:

- Type safety for API responses
- Graceful handling of failed requests
- User-friendly error messages
- Loading states for asynchronous operations

## Development Notes

### Type Safety

Special attention has been given to type safety, particularly for API responses:

- `AnalysisResult` type handles various response formats
- `ChatSession` type manages conversation state
- Conditional rendering checks prevent React child errors
- Proper null/undefined checks before accessing properties

### UI/UX Considerations

- The application provides advisory information rather than restrictions
- Yellow warnings for potential concerns rather than red errors
- Clear optimization suggestions based on social media best practices
- Responsive chat interface with loading states and error handling

## Adding New Features

When adding new features:

1. Document new functionality with JSDoc comments
2. Update type definitions to maintain type safety
3. Add proper error handling for API interactions
4. Follow existing component patterns and conventions
5. Update documentation to reflect new capabilities 