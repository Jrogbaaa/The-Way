# Analyze Post Feature: User Guide

## Accessing the Feature

To analyze your content before posting to social media:

1. **Navigate to the Upload Post page** using one of these methods:
   - Click the "Upload Post" option in the sidebar menu
   - Click "Upload Post" in the top navigation bar
   - Go directly to `/posts/upload` in your browser

   ![Navigation options](../docs/images/upload-post-nav.png)

2. **Create your post**:
   - Add a title for your post
   - Add an optional description
   - Click in the image upload area to select an image from your device

3. **Analyze your image**:
   - After selecting an image, click the "Analyze for Social Media" button
   - A progress bar will display the analysis status in real-time
   - Wait for the AI analysis to complete (typically 2-5 seconds)

4. **Review the detailed analysis results**:
   - A green box indicates the image is approved for social media
   - A red box indicates potential issues that make the image unsuitable
   - Review the data-driven pros and cons with specific engagement statistics
   - Check the estimated engagement potential with percentile ranking
   - Review platform-specific recommendations with optimal posting times

5. **Upload or modify as needed**:
   - If approved, click "Upload Post" to publish
   - If not approved, review the specific reasons and consider a different image

## Social Media Analyzer Feature

We offer a dedicated Social Media Analyzer:

1. **Access the analyzer**:
   - Click "Social Media Analyzer" in the sidebar
   - Or navigate directly to `/social-analyzer` in your browser

2. **How it works**:
   - Upload any image to analyze
   - Get a detailed engagement prediction with data-backed pros and cons
   - Review statistically-supported recommendations for improving your post
   - No account required - faster and simpler analysis

3. **Key benefits**:
   - Focused specifically on engagement prediction with concrete metrics
   - Open-source AI models for transparent analysis
   - Performance percentages for each pro and con
   - Visual engagement score indicator with percentile ranking

## Image Generation Models

When generating images with our model selection:

1. **Real-time progress tracking**:
   - Visual progress bars show generation status
   - Estimated time remaining is displayed
   - Progress updates automatically as generation proceeds

2. **Instant image display**:
   - Generated images appear immediately after completion
   - The page automatically scrolls to show your new image
   - A success notification confirms when your image is ready

3. **Easy image management**:
   - Preview images in full-screen mode with one click
   - Download images directly with the download button
   - Generate multiple variants with different prompts

4. **Model options**:
   - Jaime model for realistic male portraits
   - SDXL model for versatile creative images
   - Custom models for specialized content

## Understanding the Analysis

The analysis provides several key insights with specific data points:

### Content Recognition
Our Hugging Face AI models identify:
- Main subjects and elements in your image
- Content categories with engagement statistics for each type
- Visual quality indicators and their impact on performance
- Potential problems that could affect audience reception

### Engagement Potential
Based on data analysis of millions of social media posts:
- Engagement score on a scale of 1-100
- Percentile ranking compared to typical social posts (e.g., "top 15%")
- Platform-specific recommendations (Instagram, Facebook, TikTok, etc.)
- Optimal posting time recommendations based on content type

### Pros and Cons
Each strength and weakness includes specific metrics:
- Percentage impact on engagement metrics (e.g., "drives 32% higher engagement")
- Comparison to average performance metrics
- Platform-specific performance differences
- Statistical backing for all recommendations

## Data-Driven Insights

Our analysis is based on social media analytics data:

- **People Content**: Images with people typically receive 38% higher engagement
- **Facial Expressions**: Positive expressions drive 32% higher engagement
- **Colorful Content**: Vibrant images generate 24% higher click-through rates
- **Food Content**: Food posts generate 43% higher engagement on Instagram
- **Animal Content**: Performs 52% above platform averages
- **Quality Issues**: Low-quality visuals result in 45% lower impression rates
- **Text Problems**: Small text reduces mobile engagement by 38%

## Best Practices

For the best results:
- Use high-quality, well-lit images
- Feature people with positive expressions when possible
- Post at the recommended times for your content type
- Use the suggested platforms for your specific content
- Follow the data-backed recommendations provided in the analysis
- Add the recommended caption types for maximum impact

## Troubleshooting

If you encounter issues:
- Make sure your image is under 5MB
- Try images in JPG, PNG, or WebP formats
- If analysis fails, try a different image
- Refresh the page if the UI becomes unresponsive
- Ensure your Hugging Face API key is correctly configured in the environment variables

For additional help, contact support at support@theway.ai. 