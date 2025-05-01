# The Way: Content AI Agent

A cutting-edge platform that empowers content creators with AI-powered tools to optimize their social media content.

## Recent Updates (July/August 2024)

- **Enhanced Google Authentication Flow**: Fixed and improved the Google OAuth authentication process:
  - Fixed profile display issues in the Navbar for Google-authenticated users
  - Implemented timeout mechanism to prevent hanging during OAuth redirects
  - Enhanced Navbar rendering to properly display user info regardless of loading state
  - Added fallback user data display from Google metadata when profile fetch fails

- **Image Optimization Feature**: Added an image optimization step to the Social Media Post Analyzer. Users can now automatically crop/resize uploaded images to recommended aspect ratios (e.g., 9:16 for TikTok/Reels/Stories) directly after analysis.
- **Text-to-Image Generator & Models Page Restructure**: Added a standard Text-to-Image generator (using SDXL) on its own dedicated page (`/generate/image`). Restructured the main Models page (`/models`) to separate models into "Standard Models" (Text-to-Image, Image-to-Video) and "Custom Trained Models" (Cristina, Jaime, Bea) sections for clarity, and updated the model link.
- **UI Consistency & Model Images**: Unified the header styling (title font, color gradient, container rounding) between the Gallery and Creator Gallery pages for a more consistent look and feel. Updated the preview images for the Bea, Cristina, and Jaime models on the Creator Gallery page with new provided photos.
- **Gallery Upload and Display Enhancements**: Improved the gallery functionality with several key updates:
  - Added robust image upload to Supabase storage with proper authentication
  - Implemented automatic gallery refresh after successful uploads
  - Created a manual refresh button with loading indicator
  - Enhanced the UI with better error handling and feedback
  - Added a "no images" state with guidance for new users
  - Optimized gallery display for various device sizes

- **Authentication Bypass Development Mode**: Added temporary authentication bypass to simplify development and testing. This includes:
  - Added a middleware file (`src/middleware.ts`) that bypasses authentication checks.
  - Created a mock user in the auth store (`src/lib/store/index.ts`) to prevent client-side authentication redirects.
  - These changes allow developers to access all pages without authentication during development.

- **Next.js Image Configuration**: Extended the `next.config.mjs` file to allow additional remote image domains, specifically adding `i.pravatar.cc` to the `remotePatterns` array to fix the error: "Invalid src prop on `next/image`, hostname is not configured under images in your `next.config.js`".

- **Content Suggestions UI Enhancement**: The A/B Testing Content Suggestions component now displays actual images (or relevant placeholders from Unsplash) instead of text previews, providing a better visual experience. This required creating `next.config.mjs` to configure allowed remote image domains.
- **Stability AI Inpainting API Tuning**: Adjusted API parameters (`strength`, `cfg_scale`, `model`) and fixed parameter names (`mask`) in the `/api/stability/inpaint` route handler to improve inpainting results.
- **Replicate API Fixes**: Ensured the `/api/replicate/predictions/[id]` route handler correctly handles asynchronous operations for polling prediction status.
- **API Key Security**: Verified that the Stability AI API key (`STABILITY_AI_API_KEY`) is correctly handled server-side and not exposed to the client.
- **Code Quality**: Fixed various TypeScript type errors identified by the validation script, improving overall code stability.

## Features

- 🖌️ **Creator Gallery** (formerly Image Creator):
  - *Now structured into Standard and Custom sections.*
  - **Standard Models**:
    - Text to Image (via Replicate SDXL, accessible at `/generate/image`)
    - Image to Video (via Replicate Wan 2.1)
  - **Custom Trained Models**:
    - Cristina Model (via Replicate)
    - Jaime Model (via Replicate)
  - Bea Generator Model (via Replicate)
  - Standard Generations Model (via Replicate SDXL)
  - Google Vertex AI Imagen (fully implemented)
  - *Uses updated preview images for Bea, Cristina, and Jaime models.*
  
- 📷 **Photo Editor**:
  - Integrated with Stability AI for Generative Fill / Inpainting
  - Features include:
    - Image Upload & Preview
    - Inpainting (using Stability AI - e.g., `stable-diffusion-xl-1024-v1-0`)
    - Generative Fill (using Stability AI - e.g., `stable-diffusion-xl-1024-v1-0`)
    - Increase Resolution (Upscale) (Currently via Replicate models - *migration pending*)
    - Drawing tools for precise editing
  - **Stability AI-Powered Editing Features**:
    - Image Upload & Preview
    - Prompt-based editing
    - Canvas drawing for masking specific areas
    - Generative Fill for content creation
    - Inpainting to replace selected areas
  - **Workflow (Inpainting/GenFill)**: 
    1. Frontend (`PhotoEditor.tsx`) allows users to upload images and draw masks
    2. Selected editing mode (inpaint/genfill) and prompt are sent to the `/api/stability/inpaint` endpoint
    3. Backend converts data URLs, calls the Stability AI API, and waits for the synchronous response
    4. On success, the generated image is returned directly to the frontend and displayed
  - **Workflow (Upscale)**: 
    1. Frontend (`PhotoEditor.tsx`) allows users to upload images
    2. Request sent to `/api/replicate/upscale`
    3. Backend starts Replicate prediction & returns prediction ID
    4. Frontend polls for prediction status via `/api/replicate/predictions/[id]` (Note: Polling endpoint might be removed/changed if upscale migrates)
    5. On success, upscaled image is displayed
  - Graceful error handling and fallbacks for API failures
  
- 🎬 **Video Creator**:
  - Convert still images to high-quality videos
  - Uses Replicate's Wan 2.1 Image-to-Video model
  - Customizable motion parameters
  
- 🤖 **AI Assistant**: 
  - Chat with a Social Media Expert Agent (powered by Replicate's Llama 2)
  - Get professional advice on social media strategy, content creation, and analytics
  
- 📊 **Social Media Content Analysis**:
  - Hugging Face-powered engagement prediction (`/api/analyze-social-post` via `/upload-post` page)
    - **Image Captioning:** Uses `Salesforce/blip-image-captioning-large`.
    - **Engagement Prediction:** Uses `facebook/bart-large-mnli` based on the generated caption.
    - **Technical Analysis:** Evaluates resolution, aspect ratio, and file size.
    - **Platform Fit:** Provides recommendations for Instagram (Post, Story/Reels) and TikTok based on aspect ratio.
    - **Actionable Insights:** Generates specific pros, cons, and suggestions for improvement based on technical and content analysis.
  - **NEW: Image Optimization**: After analysis, offers options to automatically crop/resize the image to recommended aspect ratios (e.g., 9:16 for TikTok/Reels/Stories, 1:1 or 4:5 for Instagram Posts) using server-side processing.
  - *Note: Vertex AI analysis (`/api/analyze-image`) backend exists but is not currently wired to the main UI.*
  - Get pros and cons of your content before posting
  
- 🔄 **Modular Architecture**: Easily extensible for adding new AI models and capabilities

- 🧩 **Robust API Integration**: Seamless communication with Stability AI, Replicate API, Google AI services, and Hugging Face

- 🛡️ **Error Handling**: Graceful error handling and fallbacks for API failures

- 🎬 **Free Video Generation**:
  - Image to Video conversion using Replicate's Stable Video Diffusion
  - Simple one-click interface to animate any image
  - Optimized for quality with minimal user configuration

## Authentication & Access

This application uses NextAuth.js (Auth.js) for user authentication, primarily leveraging Google OAuth for sign-in and sign-up.

### NextAuth.js Implementation

The application is configured to use NextAuth.js for authentication with the following setup:

1. **Configuration**: The auth system is configured in `src/auth.config.ts` which defines the Google provider and callback handlers.
2. **API Routes**: Authentication endpoints are exposed at `/api/auth/*` and are handled by the API route in `src/app/api/auth/[...nextauth]/route.ts`.
3. **Login/Signup Pages**: Custom login and signup pages located at `/auth/login` and `/auth/signup` that use the NextAuth.js `signIn` function for authentication.
4. **Session Management**: The `SessionProvider` in `src/components/AuthProvider.tsx` provides session information throughout the application.
5. **Protected Routes**: The middleware in `src/middleware.ts` checks authentication status and redirects unauthenticated users from protected routes.

### Environment Variables

To configure authentication, you need to set up the following environment variables in your `.env.local` file:

```
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000                # Use your deployment URL in production
NEXTAUTH_SECRET=your-strong-secret-key-here       # Generate with: openssl rand -base64 32

# Google OAuth Provider
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**For Vercel deployment:**
Make sure to add these environment variables in your Vercel project settings.

### Google OAuth Setup

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Configure the OAuth consent screen
3. Create OAuth credentials (Web application type)
4. Add your app's domains to the authorized JavaScript origins:
   - `http://localhost:3000` for local development
   - `https://your-production-domain.com` for production
5. Add the following authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` for local development
   - `https://your-production-domain.com/api/auth/callback/google` for production
6. Copy the generated Client ID and Client Secret to your environment variables

### User Session and Data Access

When a user is authenticated:
- The session object contains the user's basic information (name, email, image)
- The user ID is available as `session.user.id` for database queries
- Protected API routes can verify authentication using the `auth()` function

### Accessing User Session

In client components:
```tsx
'use client';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuthUser();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  
  return <div>Hello {user.name}</div>;
}
```

In server components:
```tsx
import { auth } from '@/auth';

export default async function MyServerComponent() {
  const session = await auth();
  
  if (!session) {
    return <div>Not authenticated</div>;
  }
  
  return <div>Hello {session.user.name}</div>;
}
```

## New Features

### Social Media Trends with Web Intelligence

We've added a comprehensive social media trends system that automatically tracks industry trends relevant for talent agencies managing celebrity social media accounts.

**Features:**
- Automated weekly web scraping of industry sources for current social media trends
- AI-powered trend extraction and categorization by platform and content type
- Interactive trend explorer with filtering by platform and category
- Search functionality to find specific trend topics
- Relevance scoring to highlight the most important trends
- Integration with the dashboard for immediate visibility

**Technical Implementation:**
- Scheduled web scraping system using Firecrawl MCP for efficient data collection
- Intelligent content extraction from various industry sources
- Supabase database integration for trend storage and retrieval
- API endpoints for trend management and retrieval
- Server-side job scheduler for recurring data updates
- Real-time trend filtering and search capabilities

**How It Benefits Talent Agencies:**
- Stay informed about platform-specific algorithm changes affecting celebrity content
- Discover trending content formats that drive higher engagement
- Learn optimal posting strategies based on industry data
- Track cross-platform trends to optimize multi-channel celebrity presence
- Receive weekly updates without manual research

### Content Calendar with AI-Optimized Posting Times

We've added a new Content Calendar feature that helps users determine the optimal times to post different types of content on social media platforms based on audience activity patterns.

**Features:**
- Platform-specific optimal posting times for Instagram Reels, Instagram Stories, and TikTok
- Day-by-day breakdown of audience activity patterns
- Visual identification of recommended posting slots
- Hourly activity breakdown with engagement percentages
- Best time highlights for each day and platform

**How to Access:**
The Content Calendar is prominently displayed on the Dashboard, providing immediate access to optimized posting schedules.

**Technical Implementation:**
- Optimized with React hooks for performance and state management
- Implements data fetching patterns to support future API integration
- Uses memoization to prevent unnecessary recalculations
- Responsive design with proper scrolling behavior for mobile devices

### Social Media Action Items

The Action Items component provides a prioritized list of tasks to help content creators stay organized and focused on high-impact social media activities.

**Features:**
- Prioritized tasks with high, medium, and low importance levels
- Filtering by priority level 
- Task completion tracking
- Category-based organization (content, engagement, growth, analytics)
- Due date indicators for time-sensitive tasks
- Platform-specific action items
- Goal-oriented task descriptions

**Technical Implementation:**
- React state management for task filtering and completion status
- Expandable task details for comprehensive information
- Visual cues for priority levels and categories
- Interactive completion toggles with status persistence

### A/B Testing Content Suggestions

The Content Suggestions component offers AI-driven recommendations for social media content with predicted engagement metrics to help creators make data-informed decisions.

**Features:**
- Multiple content variations for A/B testing
- Engagement prediction scores for each suggestion
- Platform-specific recommendations (Instagram, TikTok, Twitter, Facebook, LinkedIn)
- Content categorization by type (image, video, carousel, text)
- Caption and hashtag recommendations
- Trend alignment indicators
- Goal-oriented suggestion groups
- **Visual Previews**: Displays actual images or relevant placeholders for each suggestion.

**Technical Implementation:**
- Responsive UI with modern design patterns
- Interactive selection mechanism for comparing alternatives
- Visual engagement prediction scoring
- Platform-specific icons and integrations
- Support for multiple content formats
- Uses `next/image` with `next.config.mjs` configured for remote image domains.

### ⚠️ Feature Removal Notice: Custom AI Model Training

> The "Create Images of You" functionality has been removed due to persistent technical issues causing page unresponsiveness. This feature used Replicate's API for custom model training but was unreliable in the current implementation.
>
> All other AI features remain fully functional, including pre-trained models, image-to-video conversion, and content analysis tools.
>
> We apologize for any inconvenience and may reintroduce this feature in a future update with a more stable implementation.

### Enhanced Model Gallery UI

We've completely redesigned the model gallery with an improved visual experience:

**Features:**
- Custom representative images for each model type
- Responsive card layout with hover animations
- Visual category tags and star ratings
- Clear model status indicators
- Gradient effects and modern styling elements

Access the enhanced model gallery via the "Models" section in the sidebar.

### Social Media Expert Agent Chat

We've integrated Replicate's Llama 2 model to provide an expert social media strategist chatbot. This agent offers professional advice on social media strategy, content creation, audience engagement, analytics interpretation, and trend forecasting.

**How to Access:**
1. Click on "Chat" in the sidebar or top navigation bar
2. Start a conversation with the social media expert
3. Ask questions about any social media platform or strategy
4. Receive tailored, actionable advice

**Features:**
- Platform-specific strategies for Instagram, TikTok, LinkedIn, X, Facebook, Pinterest
- Content creation assistance for posts, captions, hashtags, and content calendars
- Audience engagement optimization tactics
- Analytics interpretation and actionable insights
- Current trend recommendations and forecasting

For detailed documentation, see [Chat Bot Documentation](./docs/chatbot.md).

### Post Analysis with Vertex AI

We've integrated Google's Vertex AI to provide intelligent image analysis for social media posts. This feature helps ensure content meets platform guidelines and estimates engagement potential.

**How to Access:**
1. Click on "Upload Post" in the sidebar or top navigation bar
2. Upload an image
3. Click "Analyze for Social Media" button
4. Review the detailed analysis before posting

**Features:**
- Content safety analysis
- Image categorization
- Engagement potential estimation
- Facial detection and analysis
- Comprehensive social media suitability assessment

For detailed documentation, see [Post Analysis Documentation](./docs/post-analysis.md).

### Social Media Analyzer with Hugging Face (New -> Updated)

We've added an alternative social media content analyzer powered by open-source Hugging Face models. This provides a focused engagement prediction analysis with clear pros and cons.

**How to Access:**
1. Click on "Analyze a Post" in the sidebar (this redirects to `/upload-post`)
2. Upload an image to analyze
3. Get instant feedback on engagement potential, technical suitability, and platform fit.

**Features:**
- Open-source AI models for transparent analysis (`Salesforce/blip-image-captioning-large`, `facebook/bart-large-mnli`)
- Visual engagement score indicator
- Technical analysis (resolution, aspect ratio, file size) with ratings
- Platform-specific formatting recommendations (Instagram, TikTok)
- Detailed pros and cons list for content optimization
- Actionable suggestions for improvement
- No account required for quick analysis

For detailed documentation, see [Post Analysis Documentation](./docs/post-analysis.md).

### Gallery Management with Supabase Storage

We've implemented a comprehensive gallery system for users to upload, view, and manage their content. This feature uses Supabase Storage for secure, authenticated image management.

**How to Access:**
1. Click on "Gallery" in the sidebar navigation
2. Upload images using the "Upload Photo" button
3. View and manage your uploaded content
4. Organize and filter content by categories

**Features:**
- Secure image uploads to user-specific storage locations
- Automatic gallery refresh after successful uploads
- Manual refresh functionality with loading indicator
- Empty state guidance for first-time users
- Responsive grid layout for optimal viewing on all devices
- Image categorization and filtering options
- Visual feedback during upload and processing
- Bearer token and cookie-based authentication

**Technical Implementation:**
- Utilizes Supabase Storage for secure, scalable image hosting
- Implements row-level security policies for data protection
- User-specific storage paths (`user_id/filename`) for proper organization
- Real-time UI updates following successful uploads
- Optimized image loading and display
- Comprehensive error handling with user-friendly messages

For detailed documentation on managing your content, see [Gallery Documentation](./the-way/docs/gallery.md).
For information on setting up Supabase storage, see [Storage Setup Guide](./the-way/docs/storage-setup.md).

### Free Video Generation with Replicate

We've integrated Replicate's implementation of Stable Video Diffusion to provide video generation capabilities. This feature allows you to animate any static image with just a few clicks.

**How to Access:**
1. Navigate to the Video Demo page at `/video-demo`
2. Or scroll down to the "Free Video Generation" section in the Storyboard Creator
3. Upload an image you want to animate
4. Optionally add a description of the desired motion
5. Click "Create Video" and watch your image come to life

**Features:**
- Convert any static image into a short animated video clip
- Simple, streamlined interface focused on ease of use
- Descriptive prompts for better motion control
- Optimized default parameters for best results

**Technical Implementation:**
- Uses Stable Video Diffusion for image-to-video generation
- Default parameters optimized for quality and performance
- Simple REST API with error handling and fallbacks
- Minimal input requirements for user convenience

For detailed documentation, see [Free Video Generation Documentation](./the-way/docs/free-video-generation.md).

### AI-Powered Photo Editor

We've integrated Google's Gemini 2.0 Pro model to provide powerful photo editing capabilities. This feature allows you to enhance and edit your photos with AI using natural language prompts.

**How to Access:**
1. Click on "Photo Editor" in the sidebar
2. Upload an image you want to edit
3. Choose from preset editing options or enter a custom editing prompt
4. Click "Apply" and see your edited photo appear
5. Download the edited image when satisfied

**Features:**
- Multiple preset editing options (Enhance, Portrait, Retouch, Dramatic)
- Custom prompt support for specific editing needs
- Side-by-side comparison of original and edited images
- One-click download of edited photos
- Supports JPEG, PNG, and WebP formats

**Technical Implementation:**
- Uses Google's Gemini 2.0 Pro model for AI image editing
- Integration with Google AI Studio API
- Intuitive UI with real-time feedback
- Minimal configuration required for users

For detailed documentation, see [Photo Editor Documentation](./the-way/docs/photo-editor.md).

## Storyboard-to-Video System

The storyboard-to-video system allows users to:

1. Create personalized AI models of themselves
2. Generate consistent AI photos as key frames in a storyboard
3. Define a narrative flow with shot descriptions
4. Automatically generate intermediate frames
5. Compile into smooth, long-form video content

### Key Concept

The system generates "keyframe" images at approximately 2-second intervals using personalized AI models, then uses video generation to create smooth motion between these consistent frames, resulting in cohesive longer-form videos where characters maintain visual consistency.

### User Flow

1. User creates personalized AI model (using existing infrastructure)
2. User defines storyboard sequence with text descriptions for each scene
3. System generates consistent keyframe images for each scene using personalized models
4. User reviews, adjusts, and approves keyframes
5. System processes approved keyframes to create interpolated video
6. User receives final video with options to edit or regenerate segments

### Technical Implementation

The storyboard-to-video system consists of several key components:

1. **Storyboard Creator**: Interface for creating and managing storyboards
2. **Character Consistency Management**: System for maintaining character consistency across frames
3. **Keyframe Generation API**: Endpoints for generating consistent keyframe images
4. **Video Interpolation System**: Service for creating smooth transitions between keyframes
5. **Timeline Component**: UI for visualizing and organizing scenes
6. **Video Processing Engine**: Backend for compiling keyframes into a final video

### Database Schema

The system uses the following database tables:

- `storyboards`: Main table for storyboard projects
- `scenes`: Individual scenes within a storyboard
- `storyboard_characters`: Characters used in storyboards
- `scene_characters`: Junction table for characters in specific scenes
- `videos`: Generated videos from storyboards

### API Endpoints

- `/api/storyboard/generate-keyframe`: Generate a keyframe image for a scene
- `/api/storyboard/generate-video`: Process keyframes into a final video

### Character Consistency

The system uses several techniques to maintain character consistency:

1. Feature extraction from personalized AI models
2. Enhanced prompts with character-specific details
3. Optional consistency analysis and enforcement

### Video Generation

Video generation occurs in two main steps:

1. Keyframe generation with consistent characters and settings
2. Frame interpolation between keyframes to create smooth motion

The system supports integration with multiple video interpolation services:

- Runway Gen-2
- D-ID
- Custom interpolation solutions

### Usage

To access the storyboard creator, navigate to:

```
/storyboard-creator
```

For more detailed documentation on the storyboard system, see the [Storyboard Documentation](./the-way/docs/storyboard.md).

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- NextAuth configured with your preferred authentication providers

### Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/the-way.git
    cd the-way
    ```
2. **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3. **Set up environment variables:**
    - Create a `.env.local` file in the root directory.
    - Add the required environment variables (see `.env.example`). Key variables include:
      - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anon key.
      - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for backend operations).
      - `REPLICATE_API_TOKEN`: Your Replicate API token.
      - `GEMINI_API_KEY`: Your Google AI (Gemini) API key.
      - `GOOGLE_PROJECT_ID`: Your Google Cloud project ID.
      - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud service account key file.
      - `NEXT_PUBLIC_APP_URL`: The base URL of your deployed application (e.g., `http://localhost:3000` for local dev).
      - `DATABASE_URL`: Your full database connection string (used by Prisma).
      - `REPLICATE_WEBHOOK_URL`: URL for Replicate webhooks (if used).
      - `REPLICATE_WEBHOOK_SECRET`: Secret for verifying Replicate webhooks (if used).
      - `STABILITY_API_KEY`: Your Stability AI API key.

4. **Database Setup (Prisma & Supabase):**
    - Ensure your `DATABASE_URL` in `.env.local` points to your Supabase PostgreSQL database.
    - Define your database models in `prisma/schema.prisma`.
    - Sync your Prisma schema with your Supabase database:
      ```bash
      npx prisma db push 
      # Or, for generating and applying SQL migrations (recommended for production):
      # npx prisma migrate dev --name your_migration_name
      ```
    - Generate the Prisma Client based on your schema:
      ```bash
      npx prisma generate
      ```

5. **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
6.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The Way is built with a modern tech stack:

- **Next.js** for server-side rendering and API routes
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **NextAuth.js** for authentication
- **AI Services** integrated for content analysis and generation

## Documentation

For more detailed information, see the following documentation files:

- [Development Guide](./DEVELOPMENT.md): Coding standards and development practices
- [API Reference](./API.md): Documentation for backend APIs
- [Image Analysis Guide](./the-way/docs/analyze-post-guide.md): How to use the image analysis features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please reach out to our team at support@contentaiagent.com.

## AI Model Integration

### Replicate Models

The application integrates with Replicate API for the following models, all featuring a consistent, professional UI with enhanced user experience:

#### Cristina Model
- Uses Replicate's custom model for generating realistic images of Cristina
- Model ID: `jrogbaaa/cristina:132c98d22d2171c64e55fe7eb539fbeef0085cb0bd5cac3e8d005234b53ef1cb`
- Includes custom parameters for optimal generation
- Features a modern, card-based interface with real-time progress tracking
- Provides immersive results presentation with full-screen success overlay

#### Jaime Model
- Uses Replicate's custom model for generating realistic images of Jaime
- Model ID: `jrogbaaa/jaimecreator:25698e8acc5ade340967890a27752f4432f0baaf10c8d58ded9e21d77ec66a09`
- Includes custom parameters for optimal generation
- Features the same professional UI as other models for a consistent experience
- Includes enhanced form elements and loading states for better user feedback
- Recently improved with robust error handling and polling mechanism for API responses
- Supports fallback paths and better validation for enhanced reliability

#### Bea Generator Model
- Uses Replicate's custom model for generating realistic images of Bea
- Model ID: `jrogbaaa/beagenerator:16f9ef38ac2f6644b738abf98d13a2cef25gD40a6ae5b8d8e3e99a941e1a39bf`
- Includes custom parameters optimized for this model
- Features the same consistent UI experience as other models
- Provides a clean, user-friendly interface for generating images

#### Standard Generations Model (SDXL)
- Uses Replicate's public Stable Diffusion XL model
- Model ID: `stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b`
- Provides high-quality general-purpose image generation
- Shares the same consistent UI pattern as the specialized models

### User Interface Features

All model pages share these enhanced UI features:

- **Consistent Two-Column Layout**: Left side for interaction, right side for model information
- **Model Information Cards**: Each model displays its specifications, use cases, and tips
- **Model Type Badges**: Clear visual indicator of whether a model is "Public" or "Custom"
- **Professional Form Layout**: Card-based design with improved input fields
- **Real-time Progress Tracking**: Animated progress bars with time estimation
- **Immersive Results Display**: Full-screen overlay for viewing generated images
- **Intuitive Image Management**: Easy download, navigation, and gallery view
- **Responsive Design**: Optimized for all device sizes with appropriate spacing
- **Loading Indicators**: Spinner animations and status updates during generation

### Google Vertex AI Imagen

The application includes fully integrated support for Google's Vertex AI Imagen image generation:

- Uses the official Google Cloud Vertex AI client library
- Leverages the latest `imagegeneration@002` model
- Provides high-quality AI image generation based on text prompts
- Supports negative prompts and multiple image generation

Setup instructions:
1. Create a Google Cloud Platform account
2. Enable Vertex AI API in your GCP project
3. Create a service account with Vertex AI User permissions
4. Generate a service account key and save it to your project
5. Configure the environment variables as described above

For detailed setup instructions, see `docs/IMAGEN_SETUP.md`.

### Google Gemini

The application integrates with Google's Gemini AI for advanced photo editing functionality:

- Uses the Gemini API to power the AI-driven photo editor
- Leverages the latest gemini-2.0-pro model for high-quality image transformations
- Supports both preset editing options and custom prompt-based editing
- Maintains the original image quality while applying AI-driven enhancements

Setup instructions:
1. Obtain a Google Gemini API key from Google AI Studio
2. Add your API key to the GEMINI_API_KEY environment variable
3. Ensure all required dependencies are installed

For detailed setup instructions, see `docs/GEMINI_SETUP.md`.

## Project Structure

```
the-way/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── imagen/     # Google Vertex AI Imagen API
│   │   │   ├── replicate/  # Replicate API
│   │   │   ├── chat/       # Gemini Chat API
│   │   │   ├── analyze-image/ # Vertex AI image analysis API
│   │   │   ├── analyze-social-post/ # Hugging Face social media analysis
│   │   │   ├── edit-image/ # Gemini photo editing API
│   │   │   └── proxy/      # Image proxy to avoid CORS issues
│   │   ├── chat/           # Chat interface with social media expert
│   │   ├── photo-editor/   # AI-powered photo editing interface
│   │   ├── social-analyzer/ # Social media post analyzer (Hugging Face)
│   │   ├── models/         # Model testing pages
│   │   │   ├── cristina/   # Cristina model page
│   │   │   ├── jaime/      # Jaime model page
│   │   │   ├── sdxl/       # Standard Generations (SDXL) page
│   │   │   └── test/       # Google Imagen test page
│   ├── components/         # Reusable components
│   │   ├── ui/             # UI components
│   │   └── layout/         # Layout components
│   └── lib/                # Utility functions and configurations
│       ├── api/            # API integration code
│       │   ├── gemini.ts   # Google Gemini API integration
│       │   ├── replicate.ts # Replicate API integration
│       │   └── vision.ts   # Google Vision API integration
├── docs/                   # Documentation
│   ├── IMAGEN_SETUP.md     # Setup guide for Vertex AI Imagen
│   ├── IMAGEN_ERRORS.md    # Common errors and solutions
│   └── chatbot.md          # Documentation for the chat feature
└── public/                 # Static assets
```

## API Endpoints

### `/api/replicate`
Handles image generation requests using the Replicate API for Cristina, Jaime, and Standard Generations models.

### `/api/imagen`
Handles image generation requests using Google Vertex AI Imagen, fully implemented with the latest Vertex AI client.

### `/api/chat`
Handles conversations with the social media expert agent powered by Replicate's Llama 2 model, providing professional social media advice and strategies.

### `/api/edit-image`
Handles photo editing requests using Google's Gemini 2.0 Pro model, transforming images based on user prompts and editing instructions.

### `/api/imagen/check-config`
Checks if the Google Cloud credentials are properly configured.

### `/api/proxy`
Proxies external image URLs to avoid CORS issues when displaying images from Replicate.

## Troubleshooting

If you encounter issues:

1. Check that your environment variables are correctly set in `.env.local`
2. Ensure that you're running the application from the correct directory
3. Verify API keys and service account credentials are valid
4. Run the environment check script: `node -r dotenv/config scripts/check-env.js`
5. See documentation in the `docs/` directory for specific services

### Authentication Bypass for Development

The application includes a development mode that bypasses authentication checks:

- The middleware (`src/middleware.ts`) is configured to bypass authentication restrictions
- A mock user is provided in the auth store (`src/lib/store/index.ts`) to prevent client-side redirects
- This allows developers to access all pages without proper authentication during development
- To restore authentication:
  - Remove or disable the middleware implementation
  - Reset the auth store to use `null` as the default user state
  - Restart the development server

### Next.js Image Configuration

If you encounter errors with remote images like `Invalid src prop on next/image, hostname is not configured`:

1. Check which remote domain is causing the issue in the error message
2. Open `next.config.mjs` and add the domain to the `remotePatterns` array
3. Follow the existing pattern for domains like `i.pravatar.cc`, `images.unsplash.com`, and `replicate.delivery`.
4. Restart the development server after making changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.io)
- [Replicate](https://replicate.com)
- [Google Vertex AI](https://cloud.google.com/vertex-ai)

## Deployment

### Vercel Deployment

The application is deployed using [Vercel](https://vercel.com/). The deployment process is automated through GitHub integration.

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure the required environment variables in Vercel dashboard:
   - All the environment variables listed in the `.env.example` file

For manual deployment, use:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Environment Variables

Ensure all required environment variables are set in the Vercel dashboard:

- `GEMINI_API_KEY` - Google Gemini API key for chat functionality
- `GOOGLE_API_KEY` - Google API key for other Google services
- `VERTEX_AI_LOCATION` - Location for Vertex AI services (e.g., us-central1)
- `GOOGLE_CLOUD_VISION_CREDENTIALS` - Base64 encoded Google Vision credentials
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `REPLICATE_API_TOKEN` - Replicate API token
- `NEXT_PUBLIC_APP_URL` - Public URL of your application

For detailed information about each environment variable, see `.env.example`.

### Google Credentials

For Google Cloud services (Vertex AI, Vision API), you need to handle the credentials file:

1. Generate a service account key from Google Cloud Console
2. For Vercel deployment, base64 encode the JSON file:
   ```bash
   cat google-credentials.json | base64
   ```
3. Store the encoded string in the `GOOGLE_CLOUD_VISION_CREDENTIALS` environment variable
4. The application automatically decodes this string during runtime

## Maintaining Application Functionality

To ensure the application remains functional and stable during development, follow these maintenance guidelines:

### Git Workflow & Push Frequency

- **Commit frequently, push strategically**
  - Make small, focused commits with clear messages
  - Push completed features or bug fixes, not partial implementations
  - Use descriptive branch names for features/fixes (e.g., `fix/image-api-connection`)
  - Run the pre-push validation script before pushing: `node scripts/pre-push-check.js`

- **Recommended push frequency**
  - Push at natural completion points (feature complete, tests pass)
  - Push at least once daily when actively developing
  - Always push before stepping away from a project for more than a day

### API Stability & Error Handling

- **Error boundaries**
  - Use the `ErrorBoundary` component for catching runtime errors
  - Add specific error boundaries around components that interact with external APIs
  - Example: `<ErrorBoundary><YourComponent /></ErrorBoundary>`

- **API error fallbacks**
  - For image generation, implement fallback images when APIs fail
  - For data fetching, include default/cached data as fallbacks
  - Add retry logic for transient API failures

- **Environment variable management**
  - Always check that API keys and endpoints are correctly configured
  - Update `.env.example` when adding new environment variables
  - Document required API permissions in the appropriate documentation

### Route Management

- **Handling route changes**
  - When changing route paths, add redirects for old routes
  - Update the `ROUTES` object in `src/lib/config.ts`
  - Update any hardcoded references to routes in components

- **Testing routes**
  - Verify that all routes in the navigation components work
  - Test deep links and direct URL access
  - Confirm redirect paths function correctly

### Testing Protocols

- **Before each commit**
  - Manually test affected components
  - Verify API integrations still function
  - Check for visual regressions

- **Before each push**
  - Run TypeScript type checking: `npx tsc --noEmit`
  - Run ESLint: `npm run lint`
  - Run pre-push validation script: `node scripts/pre-push-check.js`

- **After API changes**
  - Test all features that use the modified API
  - Verify error handling works as expected
  - Document any changes in behavior

### Troubleshooting Common Issues

- **API Connection Errors**
  - Check environment variables are correctly set
  - Verify API keys are valid and have required permissions
  - Test API endpoints directly with tools like Postman
  - Check for CORS issues in browser developer tools

- **React Component Errors**
  - Use React DevTools to inspect component state
  - Check prop types and required props
  - Look for state update issues on unmounted components

- **Route/Navigation Issues**
  - Verify route is correctly defined in ROUTES object
  - Check if the page component exists at the expected path
  - Ensure layout components are properly wrapping content

## Local Development with ComfyUI Integration

The application now supports local image editing using ComfyUI, providing faster processing and more privacy compared to cloud-based solutions.

### Setting up ComfyUI

1. **Install ComfyUI**:
   ```bash
   git clone https://github.com/comfyanonymous/ComfyUI
   cd ComfyUI
   pip install -r requirements.txt
   ```

2. **Download Required Models**:
   - Download an inpainting model like `sd_xl_turbo_1.0_fp16.safetensors` or `sd-v1-5-inpainting.ckpt`
   - Place the model in the `ComfyUI/models/checkpoints` directory

3. **Start ComfyUI**:
   ```bash
   cd ComfyUI
   python main.py
   ```
   ComfyUI will start on `http://127.0.0.1:8188` by default

4. **Using ComfyUI in The Way**:
   - After uploading an image in The Way app, select "ComfyUI Inpaint" from the editing options
   - Draw a mask over the area you want to modify
   - Enter a prompt describing what should appear in the masked area
   - Click "Generate with ComfyUI" to process locally

### Troubleshooting

- Ensure ComfyUI is running before attempting local inpainting
- Check the browser console and server logs for any errors
- Verify that the models are correctly placed in the ComfyUI directories
- Make sure you have enough GPU memory for processing

## Supabase Storage Setup

The application uses Supabase Storage for file uploads in the Gallery feature. To ensure proper functionality, you need to set up the required storage buckets and RLS (Row Level Security) policies.

### Manual Setup in Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to "Storage" in the left sidebar
3. Create a new bucket named `gallery-uploads` with public access enabled
4. Set up the following RLS policies for the bucket:
   - **INSERT**: Allow authenticated users to upload to their own directory
     - `auth.uid() = (storage.foldername)[1]::uuid`
   - **SELECT**: Allow anyone to view files (for public gallery)
     - `true`
   - **UPDATE**: Allow users to update their own files
     - `auth.uid() = (storage.foldername)[1]::uuid`
   - **DELETE**: Allow users to delete their own files
     - `auth.uid() = (storage.foldername)[1]::uuid`

### Automatic Setup with Script

Alternatively, you can use the provided setup script to configure storage:

```bash
# Make sure you have the required environment variables in .env
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY

# Run the setup script
node scripts/setup-supabase-storage.js
```

### Troubleshooting Uploads

If you encounter "401 Unauthorized" errors when uploading:

1. Ensure you have a valid, active session by signing in
2. Check that the storage bucket exists in your Supabase project
3. Verify that appropriate RLS policies are configured
4. Check browser console and API logs for specific error messages

### Storage Path Structure

Files in the gallery are stored with the following pattern:

```
gallery-uploads/[user_id]/[timestamp]-[filename]
```

This structure works with the RLS policies to ensure users can only upload to their own directory.

### Gallery Improvements (Latest)
- Added drag and drop functionality for moving images between folders
- Enhanced folder navigation with clearer visual hierarchy 
- Separated folders and images into distinct sections
- Improved folder view UI with larger, more prominent folder titles
- Fixed Supabase storage authentication issues
- Implemented proper error handling for storage operations
