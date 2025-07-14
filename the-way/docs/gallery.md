# Gallery Management

The Gallery feature allows you to upload, store, and manage your visual content in a centralized location. This document provides detailed information on how to use the Gallery effectively.

## Accessing the Gallery

You can access the Gallery in two ways:
1. Click on "Gallery" in the sidebar navigation
2. Click on the Gallery icon in the top navigation bar

## Features Overview

The Gallery provides the following features:

- **Automatic Image Saving**: Generated images are automatically saved to your gallery
- **Image Upload**: Upload images directly from your device
- **Content Management**: View, filter, and organize your uploaded content
- **Content Categorization**: Filter content by tags and categories
- **Visual Feedback**: Get real-time status updates during uploads
- **Security**: All content is securely stored with proper authentication

## Auto-Saved Generated Images

When you create images using the platform's generation tools, they are automatically saved to your gallery:

1. Generate an image using any of the text-to-image tools
2. The image is automatically saved to your gallery in the "generated" folder
3. Files are named with your prompt and timestamp for easy identification
4. You'll receive a notification when the image is successfully saved
5. Access your generated images by navigating to the "generated" folder in your gallery

**Benefits:**
- Never lose your generated creations
- Organized storage in a dedicated "generated" folder
- Descriptive filenames based on your prompts
- No additional steps required - it's completely automatic

### Auto-Save Requirements

For auto-save to work properly, you need:

1. **Authentication**: You must be signed in with your Google account
2. **Proper Configuration**: All environment variables must be set correctly
3. **Supabase Storage**: The gallery-uploads bucket must exist with proper permissions

### How Auto-Save Works

The auto-save process works as follows:

1. **Image Generation**: When you generate an image, the system detects your user session
2. **Authentication Check**: The system verifies you're logged in using multiple detection methods
3. **File Processing**: The generated image is converted to the appropriate format
4. **Storage Upload**: The image is uploaded to Supabase Storage in your user folder
5. **Notification**: You receive a confirmation that the image was saved
6. **Gallery Integration**: The image appears in your gallery's "generated" folder

### Auto-Save Troubleshooting

If images aren't saving automatically:

#### Check Your Authentication Status
- Ensure you're signed in with Google
- Look for the "Images are automatically saved to your gallery" message
- If you see "Sign in to save images," you need to authenticate

#### Verify Environment Configuration
Run the validation script to check your setup:
```bash
node scripts/validate-auto-save-env.js
```

#### Common Issues and Solutions

1. **"Session not detected" in logs:**
   - Check that `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` are set correctly
   - Verify Google OAuth credentials are configured
   - Ensure you're signed in to the application

2. **"Storage bucket not found" errors:**
   - Verify Supabase environment variables are set
   - Check that the `gallery-uploads` bucket exists in Supabase
   - Ensure RLS (Row Level Security) policies are configured

3. **Images generate but don't save:**
   - Check browser console for error messages
   - Verify `SUPABASE_SERVICE_ROLE_KEY` has proper permissions
   - Check Vercel function logs if deployed

4. **Intermittent saving issues:**
   - This may indicate network connectivity issues
   - Check Supabase service status
   - Verify API rate limits aren't being exceeded

#### Development vs Production

**Local Development:**
- Auto-save uses the NextAuth session directly
- Errors are logged to the console
- Easier to debug with direct access to logs

**Production (Vercel):**
- Auto-save uses improved session detection methods
- Check Vercel function logs for debugging
- Ensure all environment variables are set in Vercel dashboard

## Uploading Images

To upload an image to your gallery:

1. Navigate to the Gallery page
2. Click the "Upload Photo" button in the top-right corner
3. Select an image file from your device (supported formats: JPEG, PNG, GIF, WebP)
4. Preview the selected image and click "Confirm Upload" to proceed
5. Wait for the upload to complete
6. Your image will automatically appear in your gallery

## File Organization

### Folder Structure

Your gallery uses the following folder structure:
```
gallery-uploads/
├── [user-id]/
│   ├── generated/          # Auto-saved generated images
│   ├── uploads/            # Manually uploaded images
│   └── [custom-folders]/   # User-created folders
```

### File Naming Convention

**Generated Images:**
- Format: `generated-[prompt]-[timestamp].png`
- Example: `generated-beautiful-sunset-1699123456789.png`

**Uploaded Images:**
- Preserves original filename with timestamp if needed
- Example: `vacation-photo-1699123456789.jpg`

## Security and Privacy

### Access Control

- All images are private to your account
- Row Level Security (RLS) policies ensure data isolation
- Only authenticated users can access their own files

### Data Storage

- Images are stored in Supabase Storage
- Files are encrypted in transit and at rest
- Automatic backups ensure data durability

### Privacy Considerations

- Generated images are automatically saved to help preserve your work
- You can delete any image from your gallery at any time
- No image data is shared with third parties

## Performance Optimization

### Image Loading

- Images are loaded progressively for better performance
- Thumbnails are generated for faster gallery browsing
- Lazy loading reduces initial page load time

### Storage Efficiency

- Duplicate detection prevents unnecessary storage usage
- Image compression maintains quality while reducing file size
- Automatic cleanup of temporary files

## API Integration

The gallery integrates with various image generation APIs:

- **Replicate**: SDXL and custom models
- **Modal**: Custom LoRA models
- **Google Vertex AI**: Imagen models

All generated images from these services are automatically saved to your gallery when you're authenticated.

## Best Practices

1. **Regular Organization**: Create folders to organize your images
2. **Descriptive Prompts**: Use clear prompts for better auto-generated filenames
3. **Storage Management**: Periodically review and clean up old images
4. **Backup Important Images**: Download important images for local backup

## Technical Details

### Supported Formats
- **Input**: JPEG, PNG, GIF, WebP
- **Output**: PNG (for generated images), preserves original format for uploads

### File Size Limits
- Maximum file size: 10MB per image
- Recommended size: Under 5MB for optimal performance

### Browser Compatibility
- Modern browsers with HTML5 support
- JavaScript enabled for full functionality
- Cookies enabled for authentication

## Getting Help

If you experience issues with the gallery:

1. Check the troubleshooting section above
2. Run the environment validation script
3. Check browser console for error messages
4. Verify your authentication status
5. Contact support with specific error details 