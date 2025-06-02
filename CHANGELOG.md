# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Enhanced Social Media Trend Extraction System**: Major improvements to real-time industry trend discovery
  - Intelligent content filtering algorithm that automatically removes URLs, navigation elements, copyright notices, and junk content
  - Priority-based extraction system: headlines (highest priority) → statistical content → general insights
  - Advanced markdown parsing to extract article headlines (H1, H2, H3) and key section titles
  - Statistical content emphasis: prioritizes trends containing percentages, multipliers, and quantifiable data
  - Enhanced contextual summary generation from surrounding content for each discovered trend
  - Real-time web scraping from 5 major industry sources: HubSpot Marketing Blog, Sprout Social Insights, Social Media Examiner, Instagram Creators Blog, and Adweek Social Media
  - Professional source attribution with clear hostname tracking and relevance scoring (6-10 scale)
  - Manual refresh capability via "Scrape Real Trends" button for on-demand industry insights
  - Improved trend quality: now extracts meaningful headlines like "AI-Generated Content Reaches 40% of Instagram Posts" instead of random links or poorly formatted text
  - Better content validation with length checks and formatting requirements
  - Enhanced link cleaning that preserves text content while removing markdown link syntax

- **Replicate Image Generation Improvements**: Major fixes and enhancements for custom model image generation
  - Implemented Replicate predictions API for reliable custom model inference instead of streaming run() method
  - Added comprehensive ReadableStream handling for streaming responses from Replicate API  
  - Enhanced error handling with fallback mechanisms and timeout controls
  - Added proper array/string type checking to prevent TypeError issues in frontend
  - Improved custom model integration for user-trained models (Jaime, Cristina, Bea)
  - Enhanced frontend robustness to handle different response formats safely
  - All Jest unit tests passing (22/22) ensuring code stability

- Enhanced Model Gallery UI with custom model previews, animations, and improved styling
- Added responsive card layout with hover effects to the models page
- Added visual category tags and status indicators to model cards
- Implemented custom StabilityClient SDK for improved Stability AI integration
- Added multi-directional outpainting support to the Photo Editor
- Added Search & Replace feature to swap objects in images
- Added Recolor feature to change colors of specific objects while preserving the rest of the image
- Enhanced error handling and logging for Stability AI API interactions
- Optimized image preparation pipeline with automatic resizing for API requirements
- Integrated BRIA AI GenFill feature to add objects to masked areas of images
- Added task-based interface to the Photo Editor for more intuitive feature selection
- Improved masking functionality with visual overlay instructions
- Enhanced GenFill mode with step-by-step instructions and visual guidance
- Added Bria AI integration for image upscaling (`/increase_resolution`)
- Added Bria AI integration for image expansion (`/image_expansion`)
- Added basic image upload and preview to the new Photo Editor page
- Google Sign-In integration using Supabase Auth.
- Personalized navigation bar showing user's Google photo and name/email when logged in.
- Gated feature access: Redirects logged-out users to signup when attempting to access core features.
- Drag and drop functionality for moving images between folders in gallery
- Enhanced folder view with prominent folder titles and improved navigation
- Fixed Modal integration for custom model training:
  - Fixed LoRA target modules detection for Stable Diffusion fine-tuning
  - Implemented dynamic module detection for different model architectures
  - Resolved NextJS API route issues with dynamic parameters
  - Improved error handling in Modal Python scripts
  - Enhanced TypeScript type safety in API routes
  - Added detailed documentation for Modal setup and troubleshooting

### Changed
- Updated navigation menu to replace standalone GenFill page with consolidated Photo Editor functionality
- Improved Photo Editor UI with clearer instructions and visual cues for masking operations
- Enhanced drawing tools with toggle buttons for Draw/Erase modes
- Added floating instruction overlays for better user guidance in masking modes
- Restarted Bria AI integration for Photo Editor, removing previous implementation and SDK
- Rebranded from "Social AI Agent" to "Content AI Agent" across the entire application
- Updated all documentation to reflect the new branding
- Improved UI consistency throughout the application
- Repositioned gallery back button to the left side of the navigation for more intuitive UI
- Updated folder icons to match the purple theme of the application for visual consistency

### Removed
- Removed standalone GenFill page and route to consolidate functionality into the Photo Editor
- Removed "Create Images of You" feature due to persistent technical issues and API reliability problems
- Removed related API endpoints, store files, and components for the custom model training feature
- Removed previous Photo Editor page component and associated API routes/SDK
- Removed Photo Editor documentation file (`docs/photo-editor.md`) prior to rebuild

### Fixed
- Fixed Gallery page to work with NextAuth.js instead of Supabase Auth
  - Updated API routes to use NextAuth session instead of Supabase token-based auth
  - Removed dependency on Supabase session in client-side code
  - Fixed authentication flow for uploading and managing gallery items
  - Improved error handling for session validation
- Fixed NextAuth.js authentication implementation
  - Added proper Credentials provider configuration
  - Fixed environment variable configuration (AUTH_SECRET and NEXTAUTH_URL)
  - Added proper error handling for authentication failures
  - Enhanced TypeScript definitions in AuthProvider component
  - Fixed interface inconsistencies across components using auth context
  - Improved login/signup forms with proper error handling
- Fixed Google OAuth authentication flow and profile display issues in Navbar
  - Implemented timeout mechanism for Supabase `getUser()` calls that hang during OAuth redirects
  - Enhanced cookie handling for Vercel deployments to prevent authentication loops
  - Fixed cookie domain configuration for localhost, Vercel deployments, and custom domains
  - Added stronger error handling in the auth callback route
  - Improved session persistence across redirects
  - Added automatic profile creation for new users after successful OAuth login
  - Enhanced Navbar rendering to properly display user info regardless of loading state
  - Added fallback user data display from Google metadata when profile fetch fails
  - Implemented a timeout safety mechanism to prevent infinite loading states
- Fixed Link component error in Dashboard page causing prop type errors
- Updated the Dashboard to use valid routes after feature removal
- Updated documentation to reflect feature removal and UI improvements
- Fixed 404 error when clicking on the Video Creator tab by updating route path to point directly to "/models/image-to-video"
- Fixed metadata error in Photo Editor page by separating client and server components
- Resolved Supabase storage authentication issues in gallery
- Fixed error handling for storage operations
- Addressed issues with folder creation and file movement
- Fixed file and folder deletion functionality in gallery with server-side API endpoints
- Resolved port-specific authentication issues affecting gallery operations
- Improved error handling and feedback for delete operations in gallery
- Fixed image move functionality in gallery
  - Enhanced folder selection dropdown to display all available folders correctly
  - Ensured Gallery Home is always available as a destination option
  - Fixed UI inconsistencies in the move dialog
  - Improved visual feedback during the move operation
  - Added better error handling for edge cases with no folders
  - Ensured consistent terminology using "Gallery Home" instead of "Root"

### Updated
- Updated authentication implementation to use NextAuth.js with both Google OAuth and credential providers
- Updated documentation in README.md to explain feature removal and UI enhancements
- Updated documentation in docs/custom-model-training.md and docs/user-guide-custom-models.md to reflect feature removal
- Consolidated video generation features into a single Video Creator tab
- Integrated Longform Video feature within the Video Creator interface
- Improved documentation for video generation capabilities
- Removed standalone Longform Video from sidebar to reduce navigation clutter
- Enhanced Photo Editor UI with professional styling and added back button for improved navigation
- Improved Photo Editor component to match the application's design system

### Added (Previous)
- Added Meta's Creator & Influencer Strategy knowledge to the Social Media Expert Chatbot
  - Included Meta's recommended 5-step creator strategy
  - Added information about performance data (19% lower acquisition costs, 71% higher brand intent lift)
  - Included details about Meta's key tools: Creator Content Recommender (CCR) and Partnership Ads Hub
  - Added core message that creators are essential for marketing success

### Fixed
- Updated the Chat page to use the real API endpoint instead of displaying demo responses
- The chatbot now properly leverages the defined system prompt including all knowledge

### Updated
- Updated documentation in `docs/chatbot.md` to reflect new capabilities
- Enhanced Social Media Expert system prompt across all implementations:
  - `src/app/api/chat/route.ts`
  - `src/lib/api/replicateChat.ts`
  - `src/lib/api/gemini.ts`

## [0.1.0] - Initial Release

### Features
- Next.js application with TypeScript
- Social Media Expert chatbot powered by Replicate's Llama 2 model
- Video generation capabilities with AI-driven prompt processing
- Initial release with basic functionality
- Image generation using AI models
- Video generation from images
- Content analysis and recommendations
- Dashboard for content overview

## [1.2.2] - 2024-04-07

### Changed
- Reorganized navigation structure for better user experience
- Renamed "Models" to "Image Creator" for clearer functionality
- Repositioned "Video Creator" to appear directly beneath "Image Creator"
- Added back button to mobile views for improved navigation
- Fixed sidebar menu to close automatically after selection on mobile
- Fixed SDXL image display issues by improving URL handling
- Restored "Content AI Agent" title to sidebar for consistent branding

## [1.2.1] - 2024-04-06

### Changed
- Improved onboarding UI with proper spacing and positioning
- Added responsive sizing to onboarding modal for better display across devices
- Updated navigation flows in onboarding to correctly direct users to appropriate features
- Fixed "Make AI Images of You" option to take users to the models page
- Enhanced modal positioning with proper margins from browser edges
- Added automatic height adjustment for smaller viewports

## [1.2.0] - 2025-01-30

### Added
- **Comprehensive Testing Infrastructure**
  - Pre-push validation script with route checking and TypeScript validation
  - Jest unit tests for API routes and image generation workflows
  - Playwright e2e tests for authentication and user flows
  - Enhanced test coverage for model creation and training workflows
  - Comprehensive error handling and validation tests

- **Enhanced Authentication Flow**
  - Triple-layer persistence strategy for training configurations through OAuth
  - Automatic training resumption after authentication
  - Comprehensive localStorage backup and recovery mechanisms
  - Enhanced training flow with auto-redirect to models page after training start
  - Smart welcome modal skipping during training flows

- **Improved Replicate API Integration**
  - Conditional webhook URL handling for development vs production environments
  - Enhanced model sanitization and validation
  - Better status tracking and model synchronization
  - Improved error handling and response formatting

- **New API Endpoints**
  - `/api/training/prepare/[tempId]` - Temporary training configuration storage
  - `/api/replicate/training-logs/[id]` - Training progress monitoring
  - `/api/webhooks/replicate` - Webhook handling for training updates
  - `/api/upload/training-images` - Direct image upload for training
  - `/api/debug/*` - Debug endpoints for development

### Fixed
- **React Hook Errors**
  - Fixed useReplicateTraining hook by updating toast import from 'react-hot-toast' to 'sonner'
  - Resolved React Hook call order issues in training components

- **TypeScript Compatibility**
  - Updated route parameter types for Next.js 15 compatibility
  - Fixed TypeScript errors in dynamic route handlers
  - Made params async as required by Next.js 15

- **Training Flow Issues**
  - Fixed localStorage persistence through OAuth redirects
  - Resolved training configuration loss during authentication
  - Enhanced error handling for failed training attempts
  - Fixed webhook validation errors (422 Unprocessable Entity)

- **Authentication Issues**
  - Fixed welcome modal interference with training flows
  - Enhanced user onboarding detection
  - Improved session management and state persistence

### Changed
- **Enhanced Components**
  - `ModalModelCreation` - Added automatic training configuration detection and resumption
  - `AuthProvider` - Enhanced with training flow detection and welcome modal logic
  - `WelcomeModal` - Improved conditional rendering based on user state

- **Improved API Routes**
  - Enhanced error handling across all endpoints
  - Better response formatting and status codes
  - Improved validation and sanitization

- **Development Experience**
  - Enhanced debugging capabilities with comprehensive logging
  - Improved error messages and user feedback
  - Better development vs production environment handling

### Security
- Enhanced input validation and sanitization across all API endpoints
- Improved error handling to prevent information leakage
- Better authentication state management

## [1.1.0] - 2025-01-29

### Added
- Initial implementation of custom model training with Replicate API
- User authentication with NextAuth.js
- Image generation with multiple AI models
- Basic testing infrastructure

### Fixed
- Initial bug fixes and stability improvements

## [1.0.0] - 2025-01-28

### Added
- Initial release
- Basic image generation functionality
- User interface with React and Next.js
- Integration with AI image generation APIs
