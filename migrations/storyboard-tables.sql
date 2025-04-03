-- Storyboard tables migration

-- Storyboards table
CREATE TABLE IF NOT EXISTS storyboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'processing', 'failed'))
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_storyboards_updated_at
BEFORE UPDATE ON storyboards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storyboard_id UUID REFERENCES storyboards(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  description TEXT,
  shot_type TEXT NOT NULL,
  setting TEXT,
  keyframe_url TEXT,
  timestamp FLOAT NOT NULL,
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'complete', 'failed')),
  generation_parameters JSONB
);

-- Characters table (referenced by scene_characters)
CREATE TABLE IF NOT EXISTS storyboard_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  features JSONB
);

-- Scene characters junction table
CREATE TABLE IF NOT EXISTS scene_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  character_id UUID REFERENCES storyboard_characters(id) ON DELETE CASCADE,
  emotion TEXT,
  position TEXT
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storyboard_id UUID REFERENCES storyboards(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  duration FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'failed')),
  processing_metadata JSONB
);

-- Indexes for better performance
CREATE INDEX idx_storyboards_user_id ON storyboards(user_id);
CREATE INDEX idx_scenes_storyboard_id ON scenes(storyboard_id);
CREATE INDEX idx_scene_characters_scene_id ON scene_characters(scene_id);
CREATE INDEX idx_scene_characters_character_id ON scene_characters(character_id);
CREATE INDEX idx_videos_storyboard_id ON videos(storyboard_id);

-- RLS Policies

-- Storyboards access - only owner can view/edit their storyboards
ALTER TABLE storyboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY storyboards_select_policy ON storyboards
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY storyboards_insert_policy ON storyboards
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY storyboards_update_policy ON storyboards
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY storyboards_delete_policy ON storyboards
  FOR DELETE 
  USING (user_id = auth.uid());

-- Scenes access - only owner of parent storyboard can access
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY scenes_select_policy ON scenes
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = scenes.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY scenes_insert_policy ON scenes
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = scenes.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY scenes_update_policy ON scenes
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = scenes.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY scenes_delete_policy ON scenes
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = scenes.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

-- Characters access
ALTER TABLE storyboard_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY characters_select_policy ON storyboard_characters
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY characters_insert_policy ON storyboard_characters
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY characters_update_policy ON storyboard_characters
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY characters_delete_policy ON storyboard_characters
  FOR DELETE 
  USING (user_id = auth.uid());

-- Videos access
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY videos_select_policy ON videos
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = videos.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY videos_insert_policy ON videos
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = videos.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY videos_update_policy ON videos
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = videos.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY videos_delete_policy ON videos
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM storyboards 
    WHERE storyboards.id = videos.storyboard_id 
    AND storyboards.user_id = auth.uid()
  ));

-- Scene characters access
ALTER TABLE scene_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY scene_characters_select_policy ON scene_characters
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM scenes
    JOIN storyboards ON scenes.storyboard_id = storyboards.id
    WHERE scenes.id = scene_characters.scene_id
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY scene_characters_insert_policy ON scene_characters
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM scenes
    JOIN storyboards ON scenes.storyboard_id = storyboards.id
    WHERE scenes.id = scene_characters.scene_id
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY scene_characters_update_policy ON scene_characters
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM scenes
    JOIN storyboards ON scenes.storyboard_id = storyboards.id
    WHERE scenes.id = scene_characters.scene_id
    AND storyboards.user_id = auth.uid()
  ));

CREATE POLICY scene_characters_delete_policy ON scene_characters
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM scenes
    JOIN storyboards ON scenes.storyboard_id = storyboards.id
    WHERE scenes.id = scene_characters.scene_id
    AND storyboards.user_id = auth.uid()
  )); 