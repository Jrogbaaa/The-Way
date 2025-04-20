# Supabase Storage Setup for Gallery

This guide explains how to set up the Supabase storage bucket and configure Row Level Security (RLS) policies for the Gallery feature.

## Prerequisites

Before proceeding, make sure you have:

1. A Supabase project set up
2. Your Supabase project URL and API keys
3. Administrative access to your Supabase project

## Setup Process

### Option 1: Using the Setup Script (Recommended)

We've provided a setup script that automates the creation of the storage bucket and configuration of RLS policies.

1. **Configure environment variables:**
   - Create a `.env.local` file or update your existing one
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

2. **Run the setup script:**
   ```bash
   node scripts/setup-storage-bucket.js
   ```

3. **Verify success:**
   The script will output confirmation messages when the bucket and policies are created successfully.

### Option 2: Manual Setup

If you prefer to set up manually:

1. **Create the storage bucket:**
   - Go to the Supabase Dashboard
   - Navigate to Storage > New Bucket
   - Create a bucket named `gallery-uploads`
   - Enable public access
   - Set max file size to 10MB (10485760 bytes)

2. **Configure RLS policies:**
   - Navigate to Authentication > Policies
   - Select the `storage.objects` table
   - Create the following policies:

     **SELECT policy (for viewing):**
     ```sql
     CREATE POLICY "Users can view their own uploads" 
     ON storage.objects
     FOR SELECT USING (
       bucket_id = 'gallery-uploads' AND 
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```

     **INSERT policy (for uploading):**
     ```sql
     CREATE POLICY "Users can upload to their own folder" 
     ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'gallery-uploads' AND 
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```

     **UPDATE policy:**
     ```sql
     CREATE POLICY "Users can update their own uploads" 
     ON storage.objects
     FOR UPDATE USING (
       bucket_id = 'gallery-uploads' AND 
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```

     **DELETE policy:**
     ```sql
     CREATE POLICY "Users can delete their own uploads" 
     ON storage.objects
     FOR DELETE USING (
       bucket_id = 'gallery-uploads' AND 
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```

     **Public SELECT policy (optional):**
     ```sql
     CREATE POLICY "Public can view all uploads" 
     ON storage.objects
     FOR SELECT USING (
       bucket_id = 'gallery-uploads'
     );
     ```

## Verify Configuration

You can verify your storage setup is working correctly:

1. **Check bucket existence and policies:**
   ```bash
   node scripts/check-bucket-policies.js
   ```

2. **Test uploads manually:**
   Navigate to the Supabase Dashboard > Storage > gallery-uploads and try uploading a file to ensure permissions are configured correctly.

## Path Structure and Security

The application uses a specific path structure to organize uploads:

- Each user's files are stored in a directory named with their user ID
- Files are named with a timestamp prefix for uniqueness
- Path format: `user_id/timestamp-filename.extension`

This structure ensures:
- Users can only access their own files
- File names don't conflict
- Files are organized by user

## Troubleshooting

**Common Issues:**

1. **"not authorized" error when uploading:**
   - Verify RLS policies are correctly configured
   - Check that you're using the user's ID as the first folder name
   - Ensure the user is properly authenticated

2. **"bucket not found" error:**
   - Verify the bucket name is exactly `gallery-uploads`
   - Check if the bucket was created successfully

3. **Files not appearing in the gallery:**
   - Verify the public URL configuration
   - Check that the file path follows the expected format
   - Ensure the SELECT policy allows the user to retrieve files

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Setting up storage example](https://supabase.com/docs/guides/storage/serving-static-assets)
- [RLS policy examples](https://supabase.com/docs/guides/storage/security/access-control) 