-- Create trained_models table
CREATE TABLE IF NOT EXISTS trained_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  model_url TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  keyword TEXT,
  input_parameters JSONB,
  category TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  replicate_id TEXT,
  last_used TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS trained_models_status_idx ON trained_models(status);
CREATE INDEX IF NOT EXISTS trained_models_created_at_idx ON trained_models(created_at);
CREATE INDEX IF NOT EXISTS trained_models_category_idx ON trained_models(category);

-- Create RLS policies
-- Enable RLS
ALTER TABLE trained_models ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to read public models
CREATE POLICY "Anyone can read public models"
  ON trained_models
  FOR SELECT
  USING (is_public = TRUE);

-- Create policy for authenticated users to read their own models
CREATE POLICY "Authenticated users can read their own models"
  ON trained_models
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create policy for authenticated users to insert their own models
CREATE POLICY "Authenticated users can insert their own models"
  ON trained_models
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for authenticated users to update their own models
CREATE POLICY "Authenticated users can update their own models"
  ON trained_models
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create policy for authenticated users to delete their own models
CREATE POLICY "Authenticated users can delete their own models"
  ON trained_models
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Comments for documentation
COMMENT ON TABLE trained_models IS 'Custom trained models for the application';
COMMENT ON COLUMN trained_models.id IS 'Unique identifier for the model';
COMMENT ON COLUMN trained_models.model_url IS 'URL to the trained model on Replicate';
COMMENT ON COLUMN trained_models.status IS 'Status of the model: training, ready, failed';
COMMENT ON COLUMN trained_models.keyword IS 'Trigger word to use this model in prompts';
COMMENT ON COLUMN trained_models.input_parameters IS 'Parameters used during training'; 