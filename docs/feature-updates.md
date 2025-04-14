# Feature Updates

## Video Creation Features (Updated)

### Consolidated Video Creator Tab (Latest Update)

We've consolidated the video creation features in the application to provide a more streamlined user experience:

1. **Removed standalone "Longform Video" from the sidebar**
   - The feature is now integrated within the Video Creator tab
   - This reduces navigation clutter and provides a unified video creation experience

2. **Enhanced Video Creator Tab**
   - Now includes multiple options for video generation:
     - **Image to Video**: Convert still images to high-quality videos using Replicate's Wan 2.1 model
     - **Longform Video**: Generate comprehensive narrative videos from text descriptions using Hugging Face's stable-video-diffusion-img2vid-xt model
     - **Info & Help**: Detailed documentation for both video generation methods

3. **Technical Implementation**
   - Both video generation methods remain separate under the hood, using their respective AI models:
     - **Image to Video**: Uses Replicate's Wan 2.1 model (wavespeedai/wan-2.1-i2v-720p)
     - **Longform Video**: Uses Hugging Face's stabilityai/stable-video-diffusion-img2vid-xt model

4. **User Experience Improvements**
   - Unified interface with clear tabs for different video creation methods
   - Detailed documentation and help for each feature
   - Consistent styling and navigation

### How to Use

1. Navigate to the "Video Creator" tab in the sidebar
2. Choose between:
   - **Image to Video**: Upload an image and convert it to a video
   - **Longform Video**: Enter a text description to generate a narrative video
3. Follow the on-screen instructions for each feature

This update helps streamline the application's navigation while maintaining all video generation capabilities. 