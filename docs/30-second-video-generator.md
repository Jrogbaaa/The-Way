# 30-Second AI Video Generator

## Overview

The 30-Second AI Video Generator is a powerful feature that enables users to create short-form AI videos with consistent characters and smooth transitions. This pipeline streamlines the process of creating professional ad-style videos from a single concept prompt.

## Table of Contents

1. [Key Features](#key-features)
2. [User Workflow](#user-workflow)
3. [Technical Architecture](#technical-architecture)
4. [Component Reference](#component-reference)
5. [API Reference](#api-reference)
6. [Character Consistency](#character-consistency)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting](#troubleshooting)

## Key Features

- **Single-Prompt Video Generation**: Generate complete 30-second videos from a single concept description
- **Character Consistency**: Ensure the same characters appear consistently throughout all frames
- **Cinematic Motion**: Realistic or stylized motion between keyframes
- **Storyboard Previews**: Review and approve generated keyframes before video creation
- **Style Customization**: Apply different visual styles and cinematography techniques

## User Workflow

1. **Input Video Concept**
   - Enter a brief description of the desired video (e.g., "A man walking with a baseball bat in a neon city")
   - Optionally select visual style preferences or character references

2. **Review Enhanced Prompt**
   - System automatically enhances the prompt with details for better generation
   - User can modify the enhanced prompt if desired

3. **Preview Storyboard**
   - System generates 6-10 keyframes representing the video sequence
   - Each frame shows a different moment in the narrative
   - User can approve or regenerate individual frames

4. **Generate Full Video**
   - System processes keyframes and creates smooth motion between them
   - Assembles a cohesive 30-second video
   - Adds optional effects like transitions, color grading, etc.

5. **Download or Share**
   - Download the final video in various formats
   - Share directly to social platforms or save to gallery

## Technical Architecture

The 30-Second AI Video Generator consists of four main pipeline components:

### 1. Prompt Rewriter

This component takes a user's simple video concept and expands it into a structured, detailed prompt sequence:

- **Input**: Raw video idea (single sentence or paragraph)
- **Process**: AI-powered expansion with scene transitions, lighting, camera movement, etc.
- **Output**: Series of detailed prompts representing 6-10 keyframes

### 2. Storyboard Generator

Converts the detailed prompts into visual keyframes:

- **Input**: Series of expanded keyframe prompts
- **Process**: Image generation with SDXL and character consistency preservation
- **Output**: 6-10 high-quality frames that tell a coherent story

### 3. Character Consistency System

Ensures characters maintain the same appearance across all frames:

- **Techniques**: 
  - Embedding-based character references
  - Prompt locking with consistent descriptors
  - ControlNet conditioning
  - Style preservation

### 4. Video Interpolation Engine

Creates smooth motion between keyframes:

- **Input**: Approved storyboard frames
- **Process**: Motion interpolation using specialized video generation models
- **Output**: Seamless video clips that are merged into a final 30-second video

## Component Reference

### Frontend Components

#### VideoGeneratorForm

Main input form for the video concept:

```tsx
<VideoGeneratorForm 
  onSubmit={handleSubmit}
  isProcessing={isProcessing}
  styles={availableStyles}
  presets={videoPresets}
/>
```

#### StoryboardPreview

Displays and allows management of generated keyframes:

```tsx
<StoryboardPreview
  frames={generatedFrames}
  onApprove={handleApproveFrame}
  onRegenerate={handleRegenerateFrame}
  onApproveAll={handleApproveAllFrames}
/>
```

#### VideoPlayer

Displays the generated video with additional controls:

```tsx
<VideoPlayer
  videoUrl={generatedVideoUrl}
  keyframes={approvedFrames}
  duration={30}
  onDownload={handleDownload}
  onShare={handleShare}
/>
```

### Backend Components

#### Prompt Rewriter Service

```typescript
interface PromptRewriterService {
  rewritePrompt(rawPrompt: string): Promise<KeyframePrompt[]>;
}

interface KeyframePrompt {
  scene: number;
  prompt: string;
  cameraAngle?: string;
  lighting?: string;
  action?: string;
}
```

#### Storyboard Generator Service

```typescript
interface StoryboardGeneratorService {
  generateKeyframes(
    keyframePrompts: KeyframePrompt[],
    characterReference?: CharacterReference
  ): Promise<GeneratedFrame[]>;
}

interface GeneratedFrame {
  id: string;
  imageUrl: string;
  prompt: string;
  scene: number;
  metadata: Record<string, any>;
}
```

#### Character Consistency Service

```typescript
interface CharacterConsistencyService {
  extractCharacterReference(
    referenceImage: string,
    characterDescription: string
  ): Promise<CharacterReference>;
  
  applyConsistency(
    frames: GeneratedFrame[],
    characterReference: CharacterReference
  ): Promise<GeneratedFrame[]>;
}

interface CharacterReference {
  embedding: number[];
  visualTokens: string[];
  descriptors: string[];
}
```

#### Video Generation Service

```typescript
interface VideoGenerationService {
  interpolateFrames(
    frames: GeneratedFrame[],
    options: VideoOptions
  ): Promise<string>; // Returns video URL
}

interface VideoOptions {
  fps: number;
  duration: number;
  style?: string;
  resolution: string;
  motionStrength?: number;
}
```

## API Reference

### Expand Video Prompt

**Endpoint**: `/api/video-generator/expand-prompt`

**Method**: POST

**Body**:
```json
{
  "prompt": "A man walking with a baseball bat in a neon city",
  "style": "cinematic",
  "duration": 30
}
```

**Response**:
```json
{
  "keyframePrompts": [
    {
      "scene": 1,
      "prompt": "Close-up of man's face illuminated by neon lights, determined expression, holding baseball bat",
      "cameraAngle": "close-up",
      "lighting": "neon blue and purple"
    },
    {
      "scene": 2,
      "prompt": "Man begins walking, baseball bat resting on shoulder, empty neon-lit alley stretches ahead",
      "cameraAngle": "medium shot",
      "lighting": "neon signs casting colorful shadows"
    },
    // ... more scenes
  ]
}
```

### Generate Storyboard

**Endpoint**: `/api/video-generator/generate-storyboard`

**Method**: POST

**Body**:
```json
{
  "keyframePrompts": [
    // Array of keyframe prompts from expand-prompt
  ],
  "characterReference": {
    "imageUrl": "https://example.com/character-reference.jpg",
    "description": "Man in leather jacket with short dark hair"
  }
}
```

**Response**:
```json
{
  "frames": [
    {
      "id": "frame_1",
      "imageUrl": "https://example.com/frame_1.jpg",
      "prompt": "Close-up of man's face illuminated by neon lights...",
      "scene": 1,
      "metadata": { ... }
    },
    // ... more frames
  ]
}
```

### Generate Video

**Endpoint**: `/api/video-generator/generate-video`

**Method**: POST

**Body**:
```json
{
  "frames": [
    // Array of approved frames
  ],
  "options": {
    "fps": 30,
    "duration": 30,
    "style": "cinematic",
    "resolution": "1080p",
    "motionStrength": 0.7
  }
}
```

**Response**:
```json
{
  "videoUrl": "https://example.com/generated-video.mp4",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "metadata": {
    "duration": 30,
    "frameCount": 900,
    "keyframeCount": 8
  }
}
```

## Character Consistency

The 30-Second Video Generator employs several techniques to maintain character consistency:

1. **Character Reference Embeddings**
   - Extract visual features from reference images
   - Store embeddings for consistent character representation

2. **Prompt Anchoring**
   - Consistent character descriptions across all prompts
   - Detailed physical attributes maintained in each keyframe

3. **ControlNet Integration**
   - Optional pose or reference image conditioning
   - Ensures consistent physical appearance

4. **Style Preservation**
   - Consistent visual style (cinematic, anime, photorealistic, etc.)
   - Matching color grading and lighting schemes

## Performance Considerations

To optimize performance and user experience:

1. **Asynchronous Processing**
   - All heavy computations run in background tasks
   - UI remains responsive with real-time progress updates
   - WebSocket connections for live updates

2. **Caching Strategy**
   - Character embeddings are cached for reuse
   - Keyframes are stored temporarily for rapid iteration
   - Final videos stored in object storage with CDN delivery

3. **Progressive Loading**
   - Initial keyframes shown as they become available
   - Staggered processing allows early feedback
   - Partial results viewable before full completion

4. **Resource Management**
   - Auto-scaling generation queue based on demand
   - Timeout and retry logic for resilience
   - Peak usage protections

## Troubleshooting

### Common Issues

1. **Character Inconsistency**
   - Provide a higher quality reference image
   - Add more detailed character description
   - Regenerate problematic frames with adjusted prompts

2. **Unnatural Motion**
   - Reduce the frame gap between keyframes
   - Adjust motion strength parameter
   - Use more similar poses between consecutive frames

3. **Generation Failures**
   - Check model availability and quotas
   - Verify prompt doesn't contain prohibited content
   - Try simplifying the scene complexity

### Error Codes

- `ERR_PROMPT`: Issue with prompt expansion
- `ERR_KEYFRAME`: Problem generating one or more keyframes
- `ERR_CHAR_CONSISTENCY`: Character consistency failure
- `ERR_VIDEO_GEN`: Video interpolation error
- `ERR_RESOURCE`: Resource limitation or quota exceeded 