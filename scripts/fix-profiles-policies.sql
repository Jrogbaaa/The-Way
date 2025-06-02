-- Fix profiles table RLS policies to reduce performance issues
-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can modify their own profile" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a single comprehensive policy for authenticated users
CREATE POLICY "Authenticated users can manage their own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public read access to profiles (optional - remove if you want profiles to be private)
CREATE POLICY "Public can read profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Comments
COMMENT ON POLICY "Authenticated users can manage their own profile" ON profiles IS 'Users can view, insert, update, and delete their own profile';
COMMENT ON POLICY "Public can read profiles" ON profiles IS 'Allow public read access to user profiles'; 