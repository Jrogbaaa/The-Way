# Gallery Management

The Gallery feature allows you to upload, store, and manage your visual content in a centralized location. This document provides detailed information on how to use the Gallery effectively.

## Accessing the Gallery

You can access the Gallery in two ways:
1. Click on "Gallery" in the sidebar navigation
2. Click on the Gallery icon in the top navigation bar

## Features Overview

The Gallery provides the following features:

- **Image Upload**: Upload images directly from your device
- **Content Management**: View, filter, and organize your uploaded content
- **Content Categorization**: Filter content by tags and categories
- **Visual Feedback**: Get real-time status updates during uploads
- **Security**: All content is securely stored with proper authentication

## Uploading Images

To upload an image to your gallery:

1. Navigate to the Gallery page
2. Click the "Upload Photo" button in the top-right corner
3. Select an image file from your device (supported formats: JPEG, PNG, GIF, WebP)
4. Preview the selected image and click "Confirm Upload" to proceed
5. Wait for the upload to complete
6. Your image will automatically appear in your gallery

**Note**: Maximum file size is 10MB. Only image files are accepted.

## Managing Your Content

### Viewing Your Gallery

Your gallery displays your uploaded images in a responsive grid layout. Each image card shows:
- The image itself
- Title derived from the filename
- Upload date/time
- Author information
- Tags for categorization

### Filtering Content

You can filter your gallery content by:
1. Clicking on the filter buttons at the top of the gallery
2. Clicking on tags within individual image cards
3. Using the "All" filter to view all content

### Refreshing Your Gallery

If you don't see your recently uploaded images:
1. Click the refresh button in the top-right corner
2. Wait for the gallery to reload with the latest content

## Technical Details

### Storage Implementation

The Gallery uses Supabase Storage for secure, scalable image hosting:
- Files are stored in a `gallery-uploads` bucket
- Each user's files are stored in their own directory using their unique user ID
- Path structure: `user_id/timestamp-filename.extension`
- Row-level security policies ensure users can only access their own files

### Authentication Methods

The Gallery implements two authentication approaches:

1. **Cookie-based Authentication**: Primary method using Supabase session cookies
2. **Bearer Token Authentication**: Fallback method using Authorization headers

This dual approach ensures reliable authentication across different environments.

### Security Considerations

- All uploads require authentication
- Files are stored in user-specific directories
- Row-level security policies enforce access control
- File types are validated both client-side and server-side
- File size limits are enforced (10MB max)

## Troubleshooting

### Common Issues

**Images Not Appearing After Upload**
- Try clicking the refresh button in the top-right corner
- Check your internet connection
- Verify you're logged in with the correct account

**Upload Errors**
- Ensure your file is under 10MB
- Verify you're using a supported image format
- Check that you're properly authenticated
- Try logging out and back in if authentication errors persist

**Empty Gallery**
- If you're a new user, you'll need to upload your first image
- Click the "Upload First Image" button in the empty state

## Future Enhancements

We're continuously improving the Gallery experience. Planned enhancements include:

- Advanced image editing capabilities
- Folder organization for better content management
- Bulk upload functionality
- Sharing options for collaboration
- AI-powered image tagging and categorization

For any issues or suggestions regarding the Gallery feature, please contact our support team. 