# Post Analysis with Vertex AI

## Overview

The Way platform now includes intelligent post analysis powered by Google Vertex AI. This feature helps content creators ensure their images are suitable for social media by analyzing images for potentially inappropriate content and providing engagement potential estimates.

## Features

- **Content Safety Analysis**: Automatically analyzes images for adult, violent, medical, or racy content
- **Content Categorization**: Identifies the main subjects and categorizes image content
- **Engagement Prediction**: Estimates the potential social media engagement based on image content
- **Facial Analysis**: Detects faces and analyzes expressions for better portrait optimization
- **Professional Assessment**: Provides a comprehensive analysis summary with approval status

## How to Access

1. Navigate to the "Upload Post" page via:
   - The sidebar navigation menu
   - The top navigation bar 
   - Direct URL: `/posts/upload`

2. Upload an image and click "Analyze for Social Media" to run the analysis
3. Review the analysis results before posting

## Implementation Details

This feature uses Google Vertex AI to analyze images. The implementation includes:

### API Endpoint

The `/api/analyze-image` endpoint processes image uploads and performs analysis using Vertex AI.

```typescript
// src/app/api/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageWithVertexAI } from '@/lib/api/vertex';

export async function POST(request: NextRequest) {
  // Handle image upload and pass to Vertex AI for analysis
  // Return comprehensive analysis results
}
```

### Vertex AI Integration

The analysis is performed using Google Vertex AI's image analysis capabilities:

```typescript
// src/lib/api/vertex.ts
import { VertexAI } from '@google-cloud/vertexai';

const analyzeImageWithVertexAI = async (imageBuffer: Buffer) => {
  // Initialize Vertex with your Cloud project and location
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: 'us-central1',
  });

  // Get the generative model
  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: 'gemini-1.5-pro-vision-001',
  });

  // Convert image to base64
  const base64Image = imageBuffer.toString('base64');

  // Call Vertex AI to analyze the image
  const result = await generativeModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {text: 'Analyze this image for social media appropriateness. Check for adult content, violence, and inappropriate material. Also assess its potential engagement and categorize the content.'},
          {inlineData: {data: base64Image, mimeType: 'image/jpeg'}}
        ]
      }
    ]
  });

  // Process and structure the response
  return processVertexAIResponse(result.response);
};
```

### User Interface

The upload interface in `PostUploadForm.tsx` provides a user-friendly way to analyze images before posting:

1. Upload an image
2. Click "Analyze for Social Media" 
3. Review analysis results
4. Proceed with posting if approved

## Configuration

To use this feature, ensure your Google Cloud credentials are properly configured:

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
```

## Future Enhancements

- Integration with more social media platforms for tailored analysis
- Video content analysis
- Custom content policy configuration
- Batch analysis for multiple images 