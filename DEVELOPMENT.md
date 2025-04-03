# Content AI Agent Development Guide

## Overview

The Content AI Agent is a platform for optimizing social media content using AI. This guide covers development practices, architecture, and guidelines for maintaining and extending the codebase.

## Table of Contents

- [Development Environment](#development-environment)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [Backend Integration](#backend-integration)
- [UI Components](#ui-components)
  - [Core Components](#core-components)
  - [Model Interface UI Pattern](#model-interface-ui-pattern)
  - [Onboarding UI Pattern](#onboarding-ui-pattern)
- [Image Generation](#image-generation)
- [Image Analysis](#image-analysis)
- [Code Style and Best Practices](#code-style-and-best-practices)
- [Testing](#testing)
- [Deployment](#deployment)

## Development Environment

The application is built using:

- **NextJS** - React framework
- **TypeScript** - For type safety
- **TailwindCSS** - For styling
- **Google Vertex AI** - For image analysis
- **Google Gemini** - For social media expert chat functionality
- **Hugging Face Models** - For open-source social media content analysis

### Directory Structure

```
the-way/
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── api/               # API endpoints
│   │   │   ├── imagen/        # Image generation API
│   │   │   ├── chat/          # Chat API for social media expert
│   │   │   ├── analyze-image/ # Vertex AI image analysis API
│   │   │   ├── analyze-social-post/ # Hugging Face social analysis API
│   │   ├── chat/              # Chat interface page
│   │   ├── social-analyzer/   # Social media content analyzer page
│   │   ├── onboarding/        # Onboarding component
│   ├── components/            # React components
│   │   ├── SocialMediaAnalyzer.tsx # Hugging Face-powered analyzer component
│   ├── lib/                   # Utility functions & API clients
│   │   ├── api/               # API integration code
│   │   │   ├── gemini.ts      # Google Gemini integration
│   │   │   ├── replicate.ts   # Replicate integration
│   │   │   ├── vision.ts      # Google Vision integration
│   │   ├── vertex.ts          # Google Vertex AI integration
│   ├── types/                 # TypeScript type definitions
│   └── public/                # Static assets
```

## Architecture

The application is built using:

- **NextJS** - React framework
- **TypeScript** - For type safety
- **TailwindCSS** - For styling
- **Google Vertex AI** - For image analysis
- **Google Gemini** - For social media expert chat functionality
- **Hugging Face Models** - For open-source social media content analysis

### Directory Structure

```
the-way/
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── api/               # API endpoints
│   │   │   ├── imagen/        # Image generation API
│   │   │   ├── chat/          # Chat API for social media expert
│   │   │   ├── analyze-image/ # Vertex AI image analysis API
│   │   │   ├── analyze-social-post/ # Hugging Face social analysis API
│   │   ├── chat/              # Chat interface page
│   │   ├── social-analyzer/   # Social media content analyzer page
│   │   ├── onboarding/        # Onboarding component
│   ├── components/            # React components
│   │   ├── SocialMediaAnalyzer.tsx # Hugging Face-powered analyzer component
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

### Model Interface UI Pattern

All model interfaces in The Way follow a consistent UI pattern to ensure a uniform user experience:

### Layout Structure
- **Header**: Includes a back button to return to the models page and a model title
- **Two-Column Layout**: 
  - Left column (wider): Contains the model tips section, form elements, and results
  - Right column (narrower): Contains information about the model, its features, and use cases
- **Model Badge**: Displays whether the model is "Public" or "Custom" in a colored badge

### Model Information
- **Tips Card**: Highlighted section with an icon containing best practices and example prompts
- **About Model Card**: Sidebar information about the model, including key features and usage recommendations

### Form Elements
- **Generate Image Section**: Card-based container with:
  - Clear section header
  - Prompt input field
  - Optional negative prompt field
  - Submit button with loading state
- **Error Handling**: Red error message display when issues occur

### Progress Tracking
- **Progress Bar**: Shows status of image generation
- **Animated Spinner**: Indicates loading state
- **Time Estimate**: Shows estimated time remaining

### Results Display
- **Generated Images**: Grid layout of thumbnails
- **Image Cards**: Each with preview, image number, and download option
- **Full-screen View**: Modal with success message, navigation controls, and download option

This consistent pattern ensures users have a familiar experience across all model interfaces, whether using standard or custom models.

### Onboarding UI Pattern

The onboarding experience appears after a user successfully signs up. It introduces the key features of the platform and guides users to their first action. The UI follows these design principles:

#### Layout Structure
- **Modal Overlay**: Positioned with proper spacing from browser edges (minimum 20-30px)
- **Responsive Container**: Adjusts based on viewport size with maximum width constraints
- **Visual Hierarchy**: Header with welcome message, followed by feature cards, then footer actions
- **High Z-index**: Ensures visibility above all other elements on the page

#### Feature Options
- **Card-based Design**: Each feature option presented in its own card
- **Clear Visuals**: Icons, headings, and descriptions that clearly communicate each feature
- **Action Buttons**: Consistent button styling with appropriate call-to-action text
- **Navigation Flows**: Each feature directs users to the appropriate destination:
  - "Make AI Images of You" directs to the models page
  - "Browse Models" takes users to the models overview
  - "Analyze Content" navigates to the post analysis page

#### Responsive Behavior
- **Auto Height Adjustment**: Dynamically calculates appropriate height based on viewport size
- **Scrollable Content**: Internal scrolling for smaller screens while maintaining fixed positioning
- **Grid Layout**: Single-column on mobile, two-column on desktop for feature options
- **Space Management**: Appropriate margins and padding to prevent content from touching edges

#### Implementation Notes
- `OnboardingWelcome` component accepts a `userName` prop for personalization
- Uses React's `useEffect` to handle viewport sizing and responsive adjustments
- Backdrop with blur effect creates visual separation from the background
- Entrance animation for a smoother user experience

This onboarding experience serves as the user's first interaction with the platform after signup, guiding them toward key features while maintaining a clean, accessible, and responsive design.

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

The platform offers two different image analysis options:

### 1. Google Vertex AI Analysis

The Vertex AI-based image analysis uses Google's advanced AI to:

1. Analyze images for content and suitability
2. Provide recommendations for social media optimization
3. Suggest platform fit and content improvements

#### Key Files:

- `lib/vertex.ts` - Integration with Google Vertex AI
- `components/PostUploadForm.tsx` - UI for image upload and analysis
- `types/index.ts` - Type definitions for analysis results

### 2. Hugging Face Analysis (New)

The Hugging Face-based analysis provides an open-source alternative that focuses on:

1. Analyzing image content with BLIP captioning model
2. Predicting engagement potential with BART-Large NLI model
3. Providing clear pros and cons for social media performance

#### Key Files:

- `app/api/analyze-social-post/route.ts` - Integration with Hugging Face models
- `components/SocialMediaAnalyzer.tsx` - UI for the standalone analyzer
- `app/social-analyzer/page.tsx` - Page component for the analyzer

#### Analysis Response Structure

The Hugging Face analysis returns data including:

- Image content caption
- Engagement score and level (Very Low to Very High)
- List of pros (content elements that will help engagement)
- List of cons (elements that may hinder engagement)
- Specific recommendations for improving engagement potential

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
- **Hugging Face errors**: Ensure your Hugging Face API key has inference permissions and is correctly set in .env

### Debugging Tools

- Browser Developer Tools
- React Developer Tools
- Next.js debugging support

## Environment Variables

The application requires the following environment variables:

- `GEMINI_API_KEY` - Google Gemini API key for chat functionality
- `GOOGLE_API_KEY` - Google API key for other Google services
- `VERTEX_API_KEY` - Google Vertex AI API key

## UI Components

### Core Components

// ... existing code ...

### Model Interface UI Pattern

// ... existing code ...

### Onboarding UI Pattern

// ... existing code ...

## Image Generation

// ... existing code ...