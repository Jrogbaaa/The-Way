# API Integration Documentation

This document outlines the API integrations used in the Social AI Agent application.

## Image Analysis API

### Endpoint

`POST /api/analyze-image`

### Request

- Method: `POST`
- Body: FormData with `image` file

### Response Structure

The response includes detailed analysis of the image for social media suitability:

```typescript
{
  analysis: {
    // Safety analysis for potentially problematic content
    safeSearch: {
      adult: string,    // e.g., "VERY_UNLIKELY", "POSSIBLE", "LIKELY", "VERY_LIKELY"
      violence: string,
      medical: string,
      racy: string
    },
    
    // Detected content labels
    labels: Array<{ 
      description: string, 
      score: number    // Confidence score between 0 and 1
    }>,
    
    // Face detection
    faces: Array<{
      // Various face attributes like expressions
      joyLikelihood?: string,
      sorrowLikelihood?: string,
      angerLikelihood?: string,
      surpriseLikelihood?: string,
      // Other possible attributes
    }>,
    
    // Overall approval status
    approvalStatus: {
      approved: boolean,
      reason: string
    },
    
    // Human-readable summary
    summary: string,
    
    // Engagement potential - can be string or object with more details
    engagementPotential: string | {
      level: string,  // e.g., "high", "medium", "low"
      reasons?: string[]
    },
    
    // Content categories
    categories: string[] | string,
    
    // Social media specific analysis
    socialMediaPotential: string,
    
    // Platform recommendations
    platformFit: string[] | string,
    
    // Optimization suggestions
    optimizationTips: string[] | string
  }
}
```

### Error Handling

Error responses have the following structure:

```typescript
{
  error: string  // Error message
}
```

## Social Media Expert Chat API

### Endpoint

`POST /api/chat`

### Request

- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: 
```json
{
  "message": "string",  // The user's message
  "chatHistory": {      // Optional chat history for context
    "history": [
      {
        "role": "user" | "model",
        "parts": [{ "text": "string" }]
      }
    ]
  }
}
```

### Response Structure

The response includes the AI-generated response and updated chat session:

```typescript
{
  // The text response from the social media expert
  response: string,
  
  // Updated chat session containing the history
  chatSession: {
    history: Array<{
      role: "user" | "model",
      parts: Array<{ text: string }>
    }>
  },
  
  // Status message
  message: string,
  
  // Status of the request
  status: "succeeded" | "failed"
}
```

### Error Handling

Error responses have the following structure:

```typescript
{
  error: string,        // Error message
  message: string,      // User-friendly error message
  status: "failed"      // Status indicator
}
```

### Common Error Codes

- `400` - Missing required message parameter
- `401` - Invalid Gemini API key
- `429` - Rate limit exceeded
- `500` - Server error or API processing error

### Implementation Notes

The chat API uses Google's Gemini Pro model to generate responses. The first message in a conversation includes a comprehensive system prompt that defines the social media expert's capabilities, knowledge, and response format.

The chat history is maintained throughout the session, enabling the AI to reference previous messages and maintain context. This ensures a more coherent and personalized conversation experience.

Example Usage:
```typescript
// Starting a new chat
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "How can I improve my Instagram engagement?",
    // No chatHistory for first message
  }),
});

const data = await response.json();
const chatSession = data.chatSession; // Save this for next message

// Continuing the conversation
const followUpResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "My audience is primarily women aged 25-34 interested in fitness",
    chatHistory: chatSession,
  }),
});
```

## AI Model Integration APIs

### Cristina Model API

`POST /api/replicate`

Generates images using the Cristina model. The response includes URLs to the generated images.

### Jaime Model API

`POST /api/replicate` 

Generates images using the Jaime model. The response includes URLs to the generated images.

## Handling API Responses

When working with these APIs:

1. Always check for error responses before processing
2. Validate the response structure against expected types
3. Use optional chaining and nullish coalescing for safety
4. Include proper type guards for union types (e.g., string | object)

Example:
```typescript
// Type guard for engagement potential
function isEngagementObject(
  value: string | { level: string; reasons?: string[] } | undefined
): value is { level: string; reasons?: string[] } {
  return typeof value === 'object' && value !== null && 'level' in value;
}

// Usage
const engagementText = isEngagementObject(result.engagementPotential) 
  ? result.engagementPotential.level 
  : result.engagementPotential || 'Unknown';
``` 