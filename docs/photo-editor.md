# Photo Editor Documentation

## Overview

The Photo Editor feature in THE WAY allows users to enhance and edit their photos using Google's Gemini 2.0 Pro AI model and Stability AI's image generation capabilities. By leveraging advanced AI technology, users can make sophisticated edits to their images with simple natural language instructions or pre-defined presets.

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
5. **Outpaint**: Extends the image beyond its original boundaries in any direction (using Stability AI)
6. **Search & Replace**: Replace specific objects or elements in an image with something else
7. **Recolor**: Change the color of specific objects in the image while maintaining everything else

#### Custom Editing

For more specific edits, users can enter custom prompts like:
- "Make the sky more blue"
- "Remove the background and replace with a beach scene"
- "Adjust the lighting to look like sunset"
- "Make my face look more professional"

#### Outpainting

The outpainting feature allows users to extend their images beyond the original boundaries:

1. **How it works**: 
   - Select the "Outpaint" tab
   - Choose one or multiple directions (top, bottom, left, or right)
   - Optionally enter a custom prompt for guiding the extension
   - Click "Apply Outpaint"

2. **Multi-Direction Support**:
   - Select any combination of directions in a single operation
   - The system will process each direction sequentially
   - A counter shows how many directions are currently selected
   - Processing time increases with the number of selected directions

3. **Directions**:
   - Top: Extends the image upward
   - Bottom: Extends the image downward
   - Left: Extends the image to the left
   - Right: Extends the image to the right

4. **Implementation details**:
   - Utilizes our custom StabilityClient SDK
   - Automatically extends the canvas by approximately 50% in each chosen direction
   - Uses advanced masking techniques to ensure seamless transitions
   - Processes each direction sequentially with the result of one operation becoming the input for the next
   - Employs direction-specific prompts to guide the AI in generating appropriate content

#### Search & Replace

The search and replace feature allows users to replace specific elements in their images:

1. **How it works**:
   - Select the "Search & Replace" tab
   - Enter what you want to replace (e.g., "red car")
   - Enter what you want to replace it with (e.g., "blue motorcycle")
   - Click "Apply Search & Replace"

2. **Implementation details**:
   - Uses Stability AI's image edit endpoint
   - Works best with clearly identifiable objects
   - Maintains the overall composition and lighting of the image

#### Recolor

The recolor feature allows changing the color of specific objects:

1. **How it works**:
   - Select the "Recolor" tab
   - Specify the object to recolor (e.g., "the shirt")
   - Enter the target color (e.g., "dark green")
   - Click "Apply Recolor"

2. **Implementation details**:
   - Uses Stability AI's image edit endpoint
   - Intelligently identifies the specified object
   - Preserves textures and lighting while changing colors

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

The Photo Editor integrates with multiple AI providers:

1. **Google's Gemini 2.0 Pro** model via the Google AI Studio API for general image editing:
   - User uploads an image and selects an editing option
   - The application sends the image and editing prompt to `/api/edit-image` endpoint
   - The server processes the request with the Gemini model
   - The edited image is returned and displayed to the user

2. **Stability AI** for advanced image editing features:
   - Custom StabilityClient SDK in `src/lib/stability-sdk.ts` handles all Stability AI interactions
   - Supports multiple editing functionalities:
     - **Outpainting**: Extends images in multiple directions using the inpainting endpoint
     - **Search & Replace**: Replaces objects or elements with new ones
     - **Recolor**: Changes the color of specific objects
   - Handles image preparation including resizing when needed
   - Includes detailed logging and error handling
   - Automatically generates appropriate prompts based on the editing task

### StabilityClient SDK

Our custom StabilityClient provides:

1. **Image Preparation**:
   - Automatically resizes images that exceed Stability's 1,048,576 pixel limit
   - Preserves aspect ratio while optimizing for API requirements

2. **Outpainting Implementation**:
   - Creates an expanded canvas in the specified direction(s)
   - Places the original image on this canvas
   - Generates a mask where white areas will be filled in and black areas preserved
   - Uses the inpainting endpoint to generate new content in the masked areas
   - Processes multiple directions sequentially, using each result as input for the next direction

3. **Search & Replace and Recolor**:
   - Constructs specialized prompts for these operations
   - Uses the image edit endpoint with carefully crafted parameters
   - Includes negative prompts to avoid common artifacts

### Environment Configuration

To use the Photo Editor, ensure your `.env.local` file includes:

```
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
STABILITY_AI_API_KEY=your_stability_api_key_here
```

### Error Handling

The Photo Editor includes comprehensive error handling for:
- File size limits
- Unsupported file formats
- API communication issues
- Model processing errors
- Detailed logging of API responses for debugging

## Usage Tips

1. **For Best Results**: Use high-quality original images with good lighting
2. **Specific Prompts**: When using custom prompts, be specific about what you want to change
3. **Multiple Edits**: You can apply multiple edits by downloading and re-uploading the image
4. **Multi-Direction Outpainting**: When outpainting in multiple directions, start with fewer directions for faster processing
5. **Search & Replace Clarity**: Be specific about what to replace and with what for best results
6. **Recolor Precision**: Clearly identify the object to recolor and provide a common color name

## Limitations

- Processing very large images may take longer
- Some complex editing requests may not achieve perfect results
- Multi-direction outpainting increases processing time proportionally
- The model works best with clear, well-lit original photos
- Search & replace works best with clearly identifiable objects
- Very specific or unusual colors may not be perfectly reproduced in recolor operations

## Troubleshooting

If you encounter issues:

1. **Image Not Loading**: Ensure your image is under 10MB and in a supported format
2. **Poor Edit Results**: Try rephrasing your prompt to be more specific
3. **API Errors**: Check your internet connection and try again
4. **Slow Processing**: Large or complex images may take longer to process
5. **Outpainting Issues**: If outpainting produces strange results, try a different direction or more descriptive prompt
6. **Search & Replace Problems**: Ensure the object to replace is clearly visible and described accurately

For additional support, contact our team at support@contentaiagent.com. 