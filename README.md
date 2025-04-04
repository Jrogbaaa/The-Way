# The Way: Content AI Agent

A cutting-edge platform that empowers content creators with AI-powered tools to optimize their social media content.

## Features

- 🖌️ **Image Creator** (formerly Models):
  - Cristina Model (via Replicate)
  - Jaime Model (via Replicate)
  - Standard Generations Model (via Replicate SDXL)
  - Google Vertex AI Imagen (fully implemented)
  
- 🎬 **Video Creator**:
  - Convert still images to high-quality videos
  - Uses Replicate's Wan 2.1 Image-to-Video model
  - Customizable motion parameters
  
- 🤖 **AI Assistant**: 
  - Chat with a Social Media Expert Agent (powered by Google Gemini)
  - Get professional advice on social media strategy, content creation, and analytics
  
- 📊 **Social Media Content Analysis**:
  - Google Vertex AI-powered comprehensive image analysis
  - Hugging Face-powered engagement prediction (open-source alternative)
  - Get pros and cons of your content before posting
  
- 🔄 **Modular Architecture**: Easily extensible for adding new AI models and capabilities

- 🧩 **Robust API Integration**: Seamless communication with Replicate API, Google AI services, and Hugging Face

- 🛡️ **Error Handling**: Graceful error handling and fallbacks for API failures

## Navigation Structure

The application has been organized for intuitive access to all features:

- **Dashboard**: View activity summary and recent content
- **Image Creator**: Create custom images with various AI models
  - All models are accessible from this section
  - Includes Cristina, Jaime, and SDXL models
- **Video Creator**: Transform still images into high-quality videos
- **Create Model**: Create and train new custom AI models
- **Analyze Post**: Analyze images for social media optimization
- **Chat**: Interact with the Social Media Expert Agent
- **Gallery**: View and manage generated content
- **Profile**: Manage your account settings

## New Features

### Social Media Expert Agent Chat

We've integrated Google's Gemini AI to provide an expert social media strategist chatbot. This agent offers professional advice on social media strategy, content creation, audience engagement, analytics interpretation, and trend forecasting.

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

### Social Media Analyzer with Hugging Face (New)

We've added an alternative social media content analyzer powered by open-source Hugging Face models. This provides a focused engagement prediction analysis with clear pros and cons.

**How to Access:**
1. Click on "Social Media Analyzer" in the sidebar
2. Upload an image to analyze
3. Get instant feedback on engagement potential

**Features:**
- Open-source AI models for transparent analysis
- Visual engagement score indicator
- Detailed pros and cons list for content optimization
- Content-specific recommendations
- No account required for quick analysis

For detailed documentation, see [Post Analysis Documentation](./docs/post-analysis.md).

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

For more detailed documentation on the storyboard system, see the [Storyboard Documentation](./docs/storyboard.md).

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- NextAuth configured with your preferred authentication providers

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/the-way.git
   cd the-way
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your configuration values.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
- [Image Analysis Guide](./analyze-post-guide.md): How to use the image analysis features

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

The application integrates with Google's Gemini AI for advanced chat functionality:

- Uses the Gemini API to power the social media expert chatbot
- Leverages the latest gemini-2.0-pro model for high-quality AI responses
- Maintains conversation context for personalized assistance
- Offers platform-specific social media expertise and actionable advice

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
│   │   │   └── proxy/      # Image proxy to avoid CORS issues
│   │   ├── chat/           # Chat interface with social media expert
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
Handles conversations with the social media expert agent powered by Google Gemini, providing professional social media advice and strategies.

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
