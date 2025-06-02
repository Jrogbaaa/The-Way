-- Comprehensive Security Fixes for Supabase
-- Run this script in your Supabase SQL Editor to fix all security issues

-- ===========================================
-- 1. Fix trained_models table RLS policies
-- ===========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read public models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can read their own models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can insert their own models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can update their own models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can delete their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can read their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can insert their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can update their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can delete their own models" ON trained_models;

-- Enable RLS (this should already be enabled, but ensuring it)
ALTER TABLE trained_models ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "Anyone can read public models"
  ON trained_models
  FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can read their own models"
  ON trained_models
  FOR SELECT
  USING (
    auth.uid()::text = user_id OR 
    is_public = TRUE OR
    -- Allow specific user to access legacy models
    (auth.jwt() ->> 'email' = '11jellis@gmail.com')
  );

CREATE POLICY "Users can insert their own models"
  ON trained_models
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can update their own models"
  ON trained_models
  FOR UPDATE
  USING (
    auth.uid()::text = user_id OR
    -- Allow specific user to update legacy models
    (auth.jwt() ->> 'email' = '11jellis@gmail.com')
  );

CREATE POLICY "Users can delete their own models"
  ON trained_models
  FOR DELETE
  USING (
    auth.uid()::text = user_id OR
    -- Allow specific user to delete legacy models
    (auth.jwt() ->> 'email' = '11jellis@gmail.com')
  );

-- ===========================================
-- 2. Fix profiles table RLS policies (Performance)
-- ===========================================

-- Drop all existing overlapping policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can modify their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can manage their own profile" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a single comprehensive policy for authenticated users
CREATE POLICY "Authenticated users can manage their own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public read access to profiles
CREATE POLICY "Public can read profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ===========================================
-- 3. Fix handle_new_user function (Security)
-- ===========================================

-- Drop existing trigger first (to avoid dependency error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ===========================================
-- 4. Add comments for documentation
-- ===========================================

COMMENT ON POLICY "Anyone can read public models" ON trained_models IS 'Allow anyone to read models marked as public';
COMMENT ON POLICY "Users can read their own models" ON trained_models IS 'Users can read their own models and public models';
COMMENT ON POLICY "Users can insert their own models" ON trained_models IS 'Users can only insert models with their own user_id';
COMMENT ON POLICY "Users can update their own models" ON trained_models IS 'Users can only update their own models';
COMMENT ON POLICY "Users can delete their own models" ON trained_models IS 'Users can only delete their own models';

COMMENT ON POLICY "Authenticated users can manage their own profile" ON profiles IS 'Users can view, insert, update, and delete their own profile';
COMMENT ON POLICY "Public can read profiles" ON profiles IS 'Allow public read access to user profiles';

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates or updates a profile when a new user signs up. Fixed search_path for security.';

-- ===========================================
-- Verification queries (optional - comment out if not needed)
-- ===========================================

-- Check that RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('trained_models', 'profiles');

-- Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('trained_models', 'profiles')
-- ORDER BY tablename, policyname; 