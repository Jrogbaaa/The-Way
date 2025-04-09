# Photo Editor Documentation

## Overview

The Photo Editor feature in THE WAY allows users to enhance and edit their photos using Google's Gemini 2.0 Pro AI model. By leveraging advanced AI capabilities, users can make sophisticated edits to their images with simple natural language instructions or pre-defined presets.

## How to Access

1. Navigate to THE WAY application
2. Click on "Photo Editor" in the sidebar navigation
3. The photo editor interface will load, ready for image uploads

## Features

### Upload Interface

- Drag and drop support for easy image uploading
- File size limit: 10MB
- Supported formats: JPEG, PNG, and WebP

### Editing Options

#### Preset Editing Modes

The photo editor comes with several predefined editing presets:

1. **Enhance**: Improves the overall quality of the photo with better lighting, contrast, and colors
2. **Portrait**: Enhances portrait features with better lighting, softer skin, and natural improvements
3. **Retouch**: Removes blemishes, spots, and imperfections from the photo
4. **Dramatic**: Applies a cinematic dramatic effect with vibrant colors and contrast

#### Custom Editing

For more specific edits, users can enter custom prompts like:
- "Make the sky more blue"
- "Remove the background and replace with a beach scene"
- "Adjust the lighting to look like sunset"
- "Make my face look more professional"

### Side-by-Side Comparison

The interface provides a side-by-side view of:
- Original image (left)
- Edited image (right)

This allows for easy comparison before downloading the final result.

### Download and Reset

- **Download**: Save the edited image to your device
- **Reset**: Clear the current image and start over
- **Back to Original**: Discard edits and return to the original image

## Technical Details

### API Integration

The Photo Editor integrates with Google's Gemini 2.0 Pro model via the Google AI Studio API. The communication flow is:

1. User uploads an image and selects an editing option
2. The application sends the image and editing prompt to `/api/edit-image` endpoint
3. The server processes the request with the Gemini model
4. The edited image is returned and displayed to the user

### Environment Configuration

To use the Photo Editor, ensure your `.env.local` file includes:

```
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
```

### Error Handling

The Photo Editor includes comprehensive error handling for:
- File size limits
- Unsupported file formats
- API communication issues
- Model processing errors

## Usage Tips

1. **For Best Results**: Use high-quality original images with good lighting
2. **Specific Prompts**: When using custom prompts, be specific about what you want to change
3. **Multiple Edits**: You can apply multiple edits by downloading and re-uploading the image
4. **Lighting Improvements**: The "Enhance" preset often gives the best results for general improvements

## Limitations

- Processing very large images may take longer
- Some complex editing requests may not achieve perfect results
- The model works best with clear, well-lit original photos
- Highly detailed or specific edits may require more precise prompting

## Troubleshooting

If you encounter issues:

1. **Image Not Loading**: Ensure your image is under 10MB and in a supported format
2. **Poor Edit Results**: Try rephrasing your prompt to be more specific
3. **API Errors**: Check your internet connection and try again
4. **Slow Processing**: Large or complex images may take longer to process

For additional support, contact our team at support@contentaiagent.com. 