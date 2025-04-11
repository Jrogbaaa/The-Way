# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Enhanced Model Gallery UI with custom model previews, animations, and improved styling
- Added responsive card layout with hover effects to the models page
- Added visual category tags and status indicators to model cards

### Removed
- Removed "Create Images of You" feature due to persistent technical issues and API reliability problems
- Removed related API endpoints, store files, and components for the custom model training feature

### Fixed
- Fixed Link component error in Dashboard page causing prop type errors
- Updated the Dashboard to use valid routes after feature removal
- Updated documentation to reflect feature removal and UI improvements

### Updated
- Updated documentation in README.md to explain feature removal and UI enhancements
- Updated documentation in docs/custom-model-training.md and docs/user-guide-custom-models.md to reflect feature removal

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

## [1.2.0] - 2024-04-05

### Added
- Added "Analyze Post" feature to the onboarding welcome component after signup
- New upload interface for quick post analysis in the onboarding process

### Changed
- Rebranded from "Social AI Agent" to "Content AI Agent" across the entire application
- Updated all documentation to reflect the new branding
- Improved UI consistency throughout the application

## [1.1.0] - 2024-04-03

### Added
- Enhanced UI for all model interfaces
- Consistent card-based layout for model interfaces
- Improved form styling with clear section headers
- Loading spinner animations during API requests
- Comprehensive documentation for UI design patterns

### Changed
- Updated Cristina and Jaime model pages to match the professional UI of standard models
- Improved documentation in README.md, DEVELOPMENT.md, and analyze-post-guide.md with current UI information
