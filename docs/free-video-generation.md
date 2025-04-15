# Free Video Generation with Replicate

The Way platform includes a video generation feature powered by Replicate's implementation of Stable Video Diffusion. This simplified interface allows you to animate any static image with just a few clicks.

## How It Works

The video generation feature uses Stable Video Diffusion to create a short animation from a single image. The process is streamlined to be as simple as possible while still providing high-quality results.

## Accessing the Feature

There are two ways to access the video generation feature:

- Navigate to the Video Demo page at `/video-demo`
- In the Storyboard Creator, scroll down to the "Free Video Generation" section

## Using the Video Generator

1. **Upload an Image**: Click on the upload area to select an image from your device
2. **Add a Prompt (Recommended)**: Enter a prompt describing the desired motion (e.g., "zoom in slowly", "pan left to right")
3. **Generate Video**: Click the "Create Video" button
4. **Wait for Processing**: Video generation typically takes 20-60 seconds
5. **View and Download**: Once complete, the video will appear and automatically play

## Best Practices

- **Add a Descriptive Prompt**: A good prompt significantly improves results
- **Use Simple Images**: Images with clear subjects and minimal complexity work best
- **Be Patient**: Generation can take 20-60 seconds to complete
- **Expect Limitations**: Complex scenes or images with people may give mixed results

## Technical Details

The video generation uses Replicate's API with the following default parameters:
- Number of frames: 25
- FPS: 7
- Motion bucket ID: 127

These parameters are optimized for quality and performance with the Stable Video Diffusion model.

## Troubleshooting

If you encounter issues with video generation:

- Ensure your image is clear and not too complex
- Try a more descriptive prompt about the motion you want
- Make sure your internet connection is stable during generation
- If a generation fails, try again with a different image or prompt

### Common Errors

**"Requested file not found" Error**

If you see this error when trying to play a generated video, it means the temporary URL from Replicate has expired. We've implemented fixes to prevent this by:

1. Converting videos to data URLs immediately after generation
2. Caching videos on our server when possible
3. Providing clear error messages when URLs expire

If you encounter this error, simply generate a new video. The application has been updated to handle these temporary URLs properly.

## Limitations

- Generated videos are short clips (typically 3-4 seconds)
- Complex scenes may not animate naturally
- The feature works best with static objects rather than people or animals
- Animations are non-deterministic - the same image and prompt may produce different results each time
