# Storyboard-to-Video System Documentation

## Overview

The storyboard-to-video system enables users to create personalized videos using AI-generated imagery with consistent characters and scenes. This system is designed to maintain visual consistency of characters across frames while allowing for narrative flexibility.

## Table of Contents

1. [Key Concepts](#key-concepts)
2. [User Workflow](#user-workflow)
3. [Component Architecture](#component-architecture)
4. [Character Consistency](#character-consistency)
5. [Shot Types Reference](#shot-types-reference)
6. [API Reference](#api-reference)
7. [Technical Implementation](#technical-implementation)
8. [Database Schema](#database-schema)
9. [Troubleshooting](#troubleshooting)

## Key Concepts

- **Personalized AI Models**: Models trained on user images to maintain consistent identity
- **Keyframes**: Static images generated at approximately 2-second intervals that define key moments
- **Frame Interpolation**: AI-powered technique that creates intermediate frames between keyframes
- **Character Consistency**: System to ensure characters maintain the same appearance across frames
- **Shot Types**: Different camera angles and framing used to convey narrative

## User Workflow

1. **Setup Personalized Models**
   - Train custom AI models on user images (handled by existing model training infrastructure)
   - Models are stored and accessible in the character selection interface

2. **Create Storyboard**
   - Define storyboard title and description
   - Add characters from available personalized models
   - Create a sequence of scenes with descriptions, settings, and shot types
   - Assign characters to each scene with specific emotions and positions

3. **Generate Keyframes**
   - For each scene, generate a keyframe image that represents that moment
   - Review and regenerate keyframes as needed for quality and consistency

4. **Create Video**
   - Process all approved keyframes into a cohesive video
   - AI interpolation creates smooth transitions between keyframes
   - Review final video and export in desired format

## Component Architecture

The system consists of several interconnected components:

### Frontend Components

1. **StoryboardCreator**
   - Main container component for the storyboard creation process
   - Manages state for scenes, characters, and generation status

2. **CharacterManager**
   - Interface for selecting and managing characters from personalized models
   - Displays available models and allows assignment to the storyboard

3. **SceneCard**
   - Individual scene editor with controls for description, setting, shot type
   - Character assignment and emotion/position controls
   - Keyframe generation and preview

4. **Timeline**
   - Horizontal visualization of all scenes in sequence
   - Drag-and-drop reordering of scenes
   - Visual indication of keyframe status

5. **ShotTypeGuide**
   - Reference guide for different shot types with examples
   - Helps users understand cinematic framing options

6. **EmotionGuide**
   - Reference for different character emotions
   - Provides prompt suggestions for specific emotions

7. **VideoPreview**
   - Player for the generated video
   - Timeline with markers for keyframes
   - Export controls and scene editing options

### Backend Components

1. **Character Consistency Management**
   - Feature extraction from personalized models
   - Prompt enhancement for consistency
   - Optional consistency enforcement

2. **Keyframe Generation API**
   - Handles generation of consistent images based on scene descriptions
   - Integrates with image generation backends

3. **Video Processing Engine**
   - Processes keyframes into a smooth video
   - Handles frame interpolation integration
   - Manages video encoding and export

4. **Storyboard Assistant**
   - AI-powered assistance for storyboard creation
   - Suggests scene sequences based on narrative premise
   - Enhances scene descriptions

## Character Consistency

Maintaining character consistency across frames is a core challenge addressed by several techniques:

1. **Model-Based Generation**
   - Uses personalized AI models as a base reference
   - Preserves core identity features across generations

2. **Feature Extraction**
   - Analyzes key physical attributes that should remain consistent
   - Includes facial structure, hair style/color, body type, etc.

3. **Enhanced Prompts**
   - Detailed descriptions of characters with consistent attributes
   - Position and emotion specifications

4. **Consistency Analysis**
   - Optional analysis of generated frames to detect inconsistencies
   - Scores character consistency across multiple frames

5. **Consistency Enforcement**
   - Optional adjustment of generated images to align with baseline features
   - Can be used for problematic frames that show inconsistency

## Shot Types Reference

The system supports various shot types to enable cinematic storytelling:

1. **Establishing Shot**
   - Wide view showing the entire setting and context
   - Used to establish location and environment

2. **Wide Shot**
   - Shows character(s) and their surroundings
   - Full body visible with environmental context

3. **Medium Shot**
   - Shows character from approximately waist up
   - Good for dialogue and interaction scenes

4. **Close-Up**
   - Focuses on face or specific detail
   - Conveys emotion and intimate moments

5. **Extreme Close-Up**
   - Very tight focus on specific detail or expression
   - Creates intensity and highlights important elements

6. **Overhead Shot**
   - View from directly above the subject
   - Useful for showing layouts or action from above

7. **Drone Shot**
   - Aerial perspective, often with movement
   - Creates sense of scale and environment

## API Reference

### Keyframe Generation

**Endpoint**: `/api/storyboard/generate-keyframe`

**Method**: POST

**Body**:
```json
{
  "sceneDescription": "Character walks through a park at sunset",
  "characters": [
    {
      "id": "char_123",
      "name": "John",
      "modelId": "model_abc",
      "emotion": "thoughtful",
      "position": "center"
    }
  ],
  "shotType": "medium",
  "setting": "park at sunset",
  "previousKeyframeUrl": "https://example.com/prev-keyframe.jpg" (optional)
}
```

**Response**:
```json
{
  "success": true,
  "keyframeUrl": "https://example.com/generated-keyframe.jpg",
  "metadata": { ... }
}
```

### Video Generation

**Endpoint**: `/api/storyboard/generate-video`

**Method**: POST

**Body**:
```json
{
  "keyframes": [
    {
      "imageUrl": "https://example.com/keyframe1.jpg",
      "timestamp": 0,
      "characters": ["char_123"],
      "sceneMetadata": { ... }
    },
    {
      "imageUrl": "https://example.com/keyframe2.jpg",
      "timestamp": 2,
      "characters": ["char_123"],
      "sceneMetadata": { ... }
    }
  ],
  "options": {
    "fps": 30,
    "resolution": "1080p",
    "quality": "standard",
    "music": "https://example.com/background-music.mp3", (optional)
    "transitionStyle": "morph" (optional)
  }
}
```

**Response**:
```json
{
  "success": true,
  "videoUrl": "https://example.com/generated-video.mp4",
  "duration": 10,
  "keyframeCount": 5
}
```

### Storyboard Suggestions

**Endpoint**: `/api/ai/storyboard-suggestions`

**Method**: POST

**Body**:
```json
{
  "premise": "A character discovers a hidden garden in the city",
  "characters": [
    {
      "name": "Alex",
      "description": "A curious photographer in their 30s"
    }
  ],
  "sceneCount": 5,
  "duration": 10
}
```

**Response**:
```json
{
  "scenes": [
    {
      "description": "Alex walking through a busy city street, camera in hand",
      "shotType": "establishing",
      "characters": ["Alex"],
      "suggestedEmotion": "curious",
      "setting": "busy city street"
    },
    // More scenes...
  ]
}
```

## Technical Implementation

### Video Interpolation

The system supports multiple video interpolation methods:

1. **Runway Gen-2**
   - Advanced AI-based frame interpolation
   - High quality results with good temporal consistency

2. **D-ID**
   - Alternative service focused on facial animations
   - Good for dialogue and character-focused scenes

3. **Fallback Options**
   - Simpler interpolation when advanced services fail
   - Can degrade to slideshow-style transitions if needed

### Error Handling

The system implements robust error handling:

1. **Character Consistency Failures**
   - Detection of inconsistent character appearances
   - Options for regeneration or adjustment

2. **Scene Generation Issues**
   - Automatic retry with simplified prompts
   - Fallback to simpler compositions

3. **Video Compilation Errors**
   - Segment-by-segment compilation
   - Progressive quality options

## Database Schema

The system uses the following database tables:

### storyboards
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to user |
| title | TEXT | Storyboard title |
| description | TEXT | Overall description |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| status | TEXT | Current status (draft, complete, processing, failed) |

### scenes
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storyboard_id | UUID | Reference to parent storyboard |
| sequence_number | INTEGER | Order in sequence |
| description | TEXT | Scene description |
| shot_type | TEXT | Type of camera shot |
| setting | TEXT | Scene location/environment |
| keyframe_url | TEXT | URL to generated image |
| timestamp | FLOAT | Position in seconds |
| generation_status | TEXT | Status of keyframe generation |
| generation_parameters | JSONB | Parameters used for generation |

### storyboard_characters
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to user |
| name | TEXT | Character name |
| model_id | TEXT | Reference to AI model |
| features | JSONB | Persistent features |

### scene_characters
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| scene_id | UUID | Reference to scene |
| character_id | UUID | Reference to character |
| emotion | TEXT | Character emotion in scene |
| position | TEXT | Character position in scene |

### videos
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storyboard_id | UUID | Reference to storyboard |
| url | TEXT | Video URL |
| duration | FLOAT | Video duration in seconds |
| created_at | TIMESTAMP | Creation timestamp |
| status | TEXT | Processing status |
| processing_metadata | JSONB | Processing details |

## Troubleshooting

### Common Issues and Solutions

1. **Character Inconsistency**
   - Problem: Character appearance varies significantly between frames
   - Solutions:
     - Regenerate problematic keyframes
     - Adjust consistency level to "high"
     - Use consistency enforcement if available

2. **Keyframe Generation Failures**
   - Problem: Keyframes fail to generate
   - Solutions:
     - Simplify scene description
     - Reduce number of characters in scene
     - Try a different shot type

3. **Video Interpolation Issues**
   - Problem: Jerky or unrealistic transitions
   - Solutions:
     - Ensure keyframes aren't too visually different
     - Try a different interpolation service
     - Adjust keyframe spacing (aim for 2-3 seconds apart)

4. **Performance Considerations**
   - Keyframe generation: 5-15 seconds per frame
   - Video processing: 1-5 minutes for a 30-second video
   - Consider draft quality for testing before final generation 