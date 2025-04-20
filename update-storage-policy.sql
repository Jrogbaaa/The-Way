-- Drop existing policies if needed (commented out by default, uncomment if you want to recreate)
-- DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update files in their own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can read files they uploaded" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete files they uploaded" ON storage.objects;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Check if upload policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can upload files to their own folder'
    ) THEN
        CREATE POLICY "Users can upload files to their own folder"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'gallery-uploads' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;

-- Check if update policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can update files in their own folder'
    ) THEN
        CREATE POLICY "Users can update files in their own folder"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'gallery-uploads' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;

-- Check if read policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can read files they uploaded'
    ) THEN
        CREATE POLICY "Users can read files they uploaded"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'gallery-uploads' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;

-- Check if delete policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can delete files they uploaded'
    ) THEN
        CREATE POLICY "Users can delete files they uploaded"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'gallery-uploads' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END
$$;

-- Create gallery-uploads bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets
        WHERE name = 'gallery-uploads'
    ) THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('gallery-uploads', 'gallery-uploads');
    END IF;
END
$$;

-- Verify policies are set correctly
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'objects'
    AND schemaname = 'storage'; 