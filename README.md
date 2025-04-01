# The Way - AI Content Platform

A full-stack Next.js application with Supabase backend that integrates multiple AI models for content generation, including image generation and future capabilities.

## Features

- 🖼️ **Multiple Image Generation Models**: 
  - Cristina Model (via Replicate)
  - Jaime Model (via Replicate)
  - Standard Generations Model (via Replicate SDXL)
  - Google Vertex AI Imagen (fully implemented)
  
- 🤖 **AI Assistant**: 
  - Chat with a Social Media Expert Agent (powered by Google Gemini)
  - Get professional advice on social media strategy, content creation, and analytics
  
- 🔄 **Modular Architecture**: Easily extensible for adding new AI models and capabilities

- 🧩 **Robust API Integration**: Seamless communication with Replicate API and Google AI services

- 🛡️ **Error Handling**: Graceful error handling and fallbacks for API failures

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

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account (for authentication and storage)
- Replicate API key
- Google Cloud service account (for Vertex AI integration)
- Google Gemini API key (for the social media expert chat)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_api_token

# Google Vertex AI Integration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json
GOOGLE_PROJECT_ID=your_gcp_project_id
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-way.git
cd the-way

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## AI Model Integration

### Replicate Models

The application integrates with Replicate API for the following models:

#### Cristina Model
- Uses Replicate's custom model for generating realistic images of Cristina
- Model ID: `jrogbaaa/cristina:132c98d22d2171c64e55fe7eb539fbeef0085cb0bd5cac3e8d005234b53ef1cb`
- Includes custom parameters for optimal generation

#### Jaime Model
- Uses Replicate's custom model for generating realistic images of Jaime
- Model ID: `jrogbaaa/jaimecreator:25698e8acc5ade340967890a27752f4432f0baaf10c8d58ded9e21d77ec66a09`
- Includes custom parameters for optimal generation

#### Standard Generations Model (SDXL)
- Uses Replicate's public Stable Diffusion XL model
- Model ID: `stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b`
- Provides high-quality general-purpose image generation

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
│   │   │   └── proxy/      # Image proxy to avoid CORS issues
│   │   ├── chat/           # Chat interface with social media expert
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

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
