# Post Analysis with Hugging Face

## Overview

The Way platform includes intelligent post analysis powered by open-source Hugging Face models. This feature helps content creators ensure their images are suitable for social media by analyzing images for content quality and providing data-driven engagement potential estimates.

## Features

- **Content Recognition**: Automatically identifies key subjects and elements in your images
- **Engagement Prediction**: Provides statistically-backed estimates of social media engagement potential
- **Detailed Pros & Cons**: Offers specific strengths and weaknesses with engagement impact percentages
- **Platform Recommendations**: Suggests optimal platforms and posting times based on content analysis
- **Data-Driven Insights**: All recommendations are backed by engagement statistics and best practices

## How to Access

1. Navigate to the "Upload Post" page via:
   - The sidebar navigation menu
   - The top navigation bar 
   - Direct URL: `/posts/upload`

2. Upload an image and click "Analyze for Social Media" to run the analysis
3. Review the detailed analysis results before posting

Alternatively, use our dedicated analyzer:

1. Navigate to "Social Media Analyzer" in the sidebar
2. Upload your image
3. Receive detailed engagement analysis

## Implementation Details

This feature uses Hugging Face's open-source AI models to analyze images. The implementation includes:

### API Endpoint

The `/api/analyze-image` endpoint processes image uploads and performs analysis using Hugging Face models:

```typescript
// src/app/api/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Hugging Face API endpoints
const HF_API_URL = 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large';
const HF_ENGAGEMENT_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';

export async function POST(request: NextRequest) {
  // Process image with Hugging Face models
  // Return comprehensive analysis results
}
```

### Hugging Face Integration

The analysis uses two key Hugging Face models:

1. **BLIP Image Captioning Model**: Generates detailed descriptions of image content
2. **BART-Large NLI Model**: Evaluates engagement potential based on image content

```typescript
// Getting image caption
async function getImageCaption(imageBuffer: Buffer, apiKey: string): Promise<string> {
  // Call Hugging Face BLIP model to generate caption
}

// Analyzing engagement potential
async function analyzeEngagement(caption: string, apiKey: string) {
  // Call Hugging Face BART model to evaluate engagement
}
```

### User Interface

The upload interface in `PostUploadForm.tsx` provides a user-friendly way to analyze images before posting:

1. Upload an image
2. Click "Analyze for Social Media" 
3. Review data-driven analysis results with clear pros and cons
4. See specific platform recommendations and engagement estimates
5. Proceed with posting

## Data-Driven Analysis

Our analysis provides concrete, statistically-backed insights:

- **Engagement Percentages**: Each pro/con includes specific engagement impact percentages
- **Platform Optimization**: Recommendations for optimal platforms based on content type
- **Posting Time Analysis**: Suggested posting times for maximum reach
- **Performance Percentiles**: Where your content likely ranks against typical posts
- **Specific Improvement Suggestions**: Actionable improvements with expected impact

## Configuration

To use this feature, ensure your Hugging Face API key is configured:

```
HUGGING_FACE_API_KEY=your_hugging_face_api_key
```

You'll need a Hugging Face API key with inference permissions for these models.

## Technical Details

The analysis pipeline works as follows:

1. **Image Upload**: User uploads an image through the UI
2. **Caption Generation**: BLIP model generates a detailed description of the image
3. **Engagement Analysis**: BART model evaluates engagement potential based on the caption
4. **Content Analysis**: Custom algorithms analyze the caption for specific content types
5. **Statistics Application**: Engagement statistics are applied based on content elements
6. **Results Formatting**: Data is organized into clear pros, cons, and recommendations
7. **UI Presentation**: Results are displayed in an easy-to-understand format

## Future Enhancements

- Integration with more social media platforms for tailored analysis
- Video content analysis
- Custom content policy configuration
- Batch analysis for multiple images 