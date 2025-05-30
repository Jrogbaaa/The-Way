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
- [Authentication](#authentication)
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
│   │   │   ├── models/        # Model management API endpoints
│   │   │   │   ├── train/     # Model training API
│   │   │   │   ├── status/    # Training status API
│   │   │   │   ├── save/      # Model saving API
│   │   │   ├── webhook/       # Webhook endpoints
│   │   │   │   ├── replicate/ # Replicate webhook handler
│   │   ├── chat/              # Chat interface page
│   │   ├── models/            # Model pages
│   │   │   ├── create/        # Custom model training page
│   │   ├── social-analyzer/   # Social media content analyzer page
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
- **Supabase** - For database
- **NextAuth.js** - For authentication with Google OAuth and credentials
- **Replicate** - For AI model inference and training
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
│   │   │   ├── models/        # Model management API endpoints
│   │   │   │   ├── train/     # Model training API
│   │   │   │   ├── status/    # Training status API
│   │   │   │   ├── save/      # Model saving API
│   │   │   ├── webhook/       # Webhook endpoints
│   │   │   │   ├── replicate/ # Replicate webhook handler
│   │   ├── chat/              # Chat interface page
│   │   ├── models/            # Model pages
│   │   │   ├── create/        # Custom model training page
│   │   ├── social-analyzer/   # Social media content analyzer page
│   ├── components/            # React components
│   │   ├── SocialMediaAnalyzer.tsx # Hugging Face-powered analyzer component
│   │   ├── ProgressBar.tsx    # Progress visualization component
│   ├── lib/                   # Utility functions & API clients
│   │   ├── api/               # API integration code
│   │   │   ├── gemini.ts      # Google Gemini integration
│   │   │   ├── replicate.ts   # Replicate integration
│   │   │   ├── replicateModels.ts # Replicate custom model operations
│   │   ├── store/             # State management
│   │   │   ├── models.ts      # Trained models store
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useGenerationProgress.ts # Progress tracking hook
│   ├── types/                 # TypeScript type definitions
│   └── public/                # Static assets
```

### Navigation Structure

The application follows a carefully organized navigation structure, which is implemented in the `Sidebar` component and reflected in the routes configuration:

#### Main Navigation Items
1. **Dashboard** - Home page showing activity summary
2. **Image Creator** - Create images with various AI models (formerly "Models")
3. **Video Creator** - Convert still images to videos
4. **Create Model** - Create and train new custom models
5. **Analyze Post** - Analyze images for social media optimization
6. **Chat** - Interact with the Social Media Expert Agent
7. **Gallery** - View and manage generated content
8. **Profile** - User account management

#### Navigation Components
- `Sidebar.tsx` - Main navigation component with mobile responsiveness
- `Navbar.tsx` - Top navigation bar for secondary actions
- `MainLayout.tsx` - Layout wrapper that includes both navigation components

#### Mobile Navigation Features
- Automatic sidebar closing after navigation
- Back buttons for nested pages
- Responsive design with proper touch targets

#### Route Configuration
All routes are centralized in `src/lib/config.ts` in the `ROUTES` object:

```typescript
export const ROUTES = {
  home: "/",
  login: "/auth/login",
  signup: "/auth/signup",
  dashboard: "/dashboard",
  profile: "/profile",
  models: "/models",             // Image Creator
  createModel: "/models/create",
  imageToVideo: "/models/image-to-video", // Video Creator
  chat: "/chat",
  gallery: "/gallery",
  uploadPost: "/posts/upload",   // Analyze Post
  socialAnalyzer: "/social-analyzer",
};
```

When adding new features, use the existing route configuration and update the `Sidebar.tsx` component to maintain navigation consistency.

### Model Training Architecture

The model training system is implemented with a client-server architecture:

#### Client-Side Components
- `models/create/page.tsx` - Main UI for model creation
- `useTrainedModelsStore` - Zustand store for model state management
- `useGenerationProgress` - Hook for tracking training progress

#### Server-Side Components
- `/api/models/train` - Processes form data and starts training
- `/api/models/status` - Checks training job status
- `/api/models/save` - Persists model data to database
- `/api/webhook/replicate` - Handles training completion webhooks

#### Data Flow
1. User submits form with model details and training images
2. Frontend sends data to `/api/models/train` endpoint
3. Server uploads images to Replicate and starts training job
4. Frontend polls `/api/models/status` for updates
5. When training completes:
   - In development: Status endpoint detects completion and saves model
   - In production: Webhook endpoint receives notification and saves model
6. Model appears in user's models list

#### Database Schema
Models are stored in a Supabase `trained_models` table with RLS policies.

## Authentication

The application uses NextAuth.js for user authentication with the following features:

### Setup
- **Configuration:** The auth configuration is in `src/auth.ts`
- **Providers:** 
  - Google OAuth for social login
  - Credentials provider for email/password

### Auth Flow
1. User signs in via Google OAuth or credentials
2. NextAuth creates and manages the user session
3. Session data is available on both client and server

### Environment Variables
Required environment variables for authentication:
```
AUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Implementation Details
- Protected routes check session status via `getServerSession` or React hooks
- Unauthenticated users are redirected to login
- User data is retrieved from the session
- Session persistence handled by HTTP-only cookies

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

### Content Calendar Component

The Content Calendar component provides users with AI-optimized posting times for social media content. It follows these key design principles:

#### Architecture
- Uses a custom hook pattern (`useContentCalendar`) to separate logic from presentation
- Implements simulated data fetching to support future API integration
- Utilizes memoization for performance optimization

#### Key Files
- `src/components/ContentCalendar.tsx` - Main component implementation
- Future: `src/hooks/useContentCalendar.ts` - Extracted hook for data and state management
- Future: `src/lib/api/contentCalendar.ts` - API integration for data fetching

#### Implementation Details
- Data structures for platform types, time slots, and schedules
- Loading state handling with skeleton UI
- Responsive design with proper overflow handling
- Accessibility support with aria attributes and keyboard navigation

#### Styling Pattern
- Card-based container with consistent border and shadow styling
- Segmented sections with clear visual hierarchy
- Interactive elements with proper hover and active states
- Optimized for both desktop and mobile viewing

This component serves as an example of how to structure scalable features with separation of concerns, data fetching patterns, and performance optimizations.

## Scalability Best Practices

To ensure the application scales effectively as more features are added, follow these best practices:

### State Management

1. **Custom Hooks Pattern**
   - Extract data fetching and state management into custom hooks
   - Separate business logic from presentation components
   - Example: `useContentCalendar` hook in the Content Calendar component

2. **Centralized Data Stores**
   - Use Zustand for global state management where appropriate
   - Create domain-specific stores rather than one large global store
   - Example: Create a dedicated store for calendar data when it grows more complex

3. **Data Fetching Patterns**
   - Implement consistent patterns for API calls across the application
   - Use loading, error, and success states consistently
   - Consider implementing a data cache layer for frequently accessed data

### Performance Optimization

1. **Component Optimization**
   - Use React.memo for pure components that render frequently
   - Implement useMemo and useCallback to prevent unnecessary recalculations
   - Example: Memoized calculations in the ContentCalendar component

2. **Code Splitting**
   - Implement dynamic imports for route-based code splitting
   - Lazy load heavy components that aren't needed on initial page load
   - Example: Lazy load complex visualization components

3. **Asset Optimization**
   - Optimize images and other static assets
   - Use Next.js Image component for automatic optimization
   - Consider implementing webp format for better compression

### Code Organization

1. **Folder Structure**
   - Organize code by feature domain rather than technical type
   - Create dedicated directories for related components, hooks, and utilities
   - Example structure:
     ```
     src/
     ├── features/
     │   ├── content-calendar/
     │   │   ├── components/
     │   │   ├── hooks/
     │   │   ├── api/
     │   │   ├── types/
     ```

2. **Modular Components**
   - Build components that are focused on a single responsibility
   - Create composition patterns rather than complex monolithic components
   - Example: Break down large components into smaller, focused pieces

3. **Type Safety**
   - Use TypeScript interfaces for all component props and API responses
   - Create reusable type definitions in domain-specific type files
   - Example: Detailed type definitions for ContentCalendar data structures

### Testing Strategies

1. **Component Testing**
   - Write tests for critical component functionality
   - Test loading, error, and success states
   - Mock API calls to test different data scenarios

2. **Hook Testing**
   - Create dedicated tests for custom hooks
   - Test state transitions and side effects
   - Example: Test `useContentCalendar` state changes with different inputs

3. **Integration Testing**
   - Test how components work together within a feature
   - Focus on user flows rather than implementation details
   - Example: Test the complete user journey through the content calendar

By following these scalability best practices, you can ensure The Way platform continues to perform well and remains maintainable as new features are added.

## Testing

The application includes comprehensive testing infrastructure to ensure code quality and reliability.

### Testing Stack

- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing
- **@testing-library/react** - React component testing utilities
- **Pre-push validation** - Automated code quality checks

### Test Structure

```
tests/
├── api-routes.test.js              # API endpoint tests
├── model-creation-workflow.test.js # Model training workflow tests
└── README.md                       # Testing documentation

src/tests/
└── api-image-generation.test.ts    # Image generation API tests

e2e/
├── auth.setup.ts                   # Authentication setup for e2e tests
├── complete-user-flow.spec.ts      # Complete user journey tests
├── custom-model-training.spec.ts   # Model training e2e tests
├── image-generation.spec.ts        # Image generation e2e tests
└── unauthenticated/               # Tests for public pages
    ├── basic-functionality.spec.ts
    ├── detailed-login-debug.spec.ts
    └── simple-login-test.spec.ts

scripts/
└── pre-push-check.js              # Pre-push validation script
```

### Running Tests

#### Unit Tests (Jest)
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test workflow
npm run test:workflow
```

#### End-to-End Tests (Playwright)
```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in debug mode
npm run test:e2e:debug
```

#### Pre-Push Validation
```bash
# Run comprehensive validation checks
node scripts/pre-push-check.js
```

### Test Categories

#### 1. Unit Tests
- **API Routes**: Test all API endpoints for correct responses and error handling
- **Image Generation**: Test image generation workflows with different models
- **Model Creation**: Test the complete model training workflow
- **Error Handling**: Test graceful error handling and fallbacks

#### 2. End-to-End Tests
- **Authentication Flow**: Test login, signup, and OAuth flows
- **Complete User Journey**: Test full user workflows from login to model creation
- **Image Generation**: Test image generation with different models and parameters
- **Model Training**: Test custom model training end-to-end
- **Mobile Responsiveness**: Test functionality across different viewport sizes

#### 3. Pre-Push Validation
- **Route Validation**: Ensure all defined routes exist and are accessible
- **TypeScript Check**: Validate TypeScript compilation without errors
- **Git Conflict Detection**: Check for unresolved merge conflicts
- **Code Quality**: Ensure code meets quality standards

### Writing Tests

#### Unit Test Example
```javascript
// tests/api-routes.test.js
describe('Model Status API Route', () => {
  test('Model status route handles dynamic params correctly', async () => {
    const mockRequest = {
      nextUrl: { pathname: '/api/modal/model-status/test-id' }
    };
    
    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'test-id' }) });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.id).toBe('test-id');
  });
});
```

#### E2E Test Example
```typescript
// e2e/image-generation.spec.ts
test('should generate image with Jaime model', async ({ page }) => {
  await page.goto('/models/jaime');
  await page.fill('[data-testid="prompt-input"]', 'a portrait of a person');
  await page.click('[data-testid="generate-button"]');
  
  await expect(page.locator('[data-testid="generated-image"]')).toBeVisible({ timeout: 30000 });
});
```

### Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/tests/**/*.test.ts'
  ]
};
```

#### Playwright Configuration (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

### Continuous Integration

The testing infrastructure is designed to work with CI/CD pipelines:

1. **Pre-Push Validation**: Run before every push to catch issues early
2. **Automated Testing**: All tests run automatically on pull requests
3. **Coverage Reports**: Generate and track test coverage metrics
4. **E2E Testing**: Run comprehensive user flow tests in multiple browsers

### Best Practices

1. **Test Isolation**: Each test should be independent and not rely on others
2. **Realistic Data**: Use realistic test data that matches production scenarios
3. **Error Testing**: Always test error conditions and edge cases
4. **Performance**: Keep tests fast and efficient
5. **Maintenance**: Regularly update tests when features change
6. **Documentation**: Document complex test scenarios and setup requirements

### Debugging Tests

#### Jest Debugging
```bash
# Run specific test file
npm test -- tests/api-routes.test.js

# Run tests with verbose output
npm test -- --verbose

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Playwright Debugging
```bash
# Run with headed browser
npm run test:e2e -- --headed

# Debug specific test
npm run test:e2e -- --debug image-generation.spec.ts

# Generate trace files
npm run test:e2e -- --trace on
```