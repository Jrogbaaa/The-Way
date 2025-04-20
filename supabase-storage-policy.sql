-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to insert (upload) files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public viewing of all files
CREATE POLICY "Public can view all gallery files"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-uploads'); 