#!/bin/bash
# Test script for the complete LoRA training and generation workflow

# Set up variables
MODEL_ID="test_lora_$(date +%s)"
TEST_DIR="test_outputs"
mkdir -p "$TEST_DIR"

echo "Testing LoRA training and generation workflow"
echo "Model ID: $MODEL_ID"

# Create a test input JSON file for training
cat > "$TEST_DIR/training_input.json" << EOL
{
  "modelId": "$MODEL_ID",
  "instancePrompt": "a photo of sks person",
  "imageDataList": [
    {
      "imageUrl": "https://images.unsplash.com/photo-1594751543129-6701ad444259",
      "caption": "a photo of sks person smiling"
    },
    {
      "imageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
      "caption": "a photo of sks person looking sideways"
    }
  ],
  "modelName": "Test LoRA Model",
  "callbackUrl": "https://example.com/api/modal/training-progress",
  "supabaseUrl": "$SUPABASE_URL",
  "supabaseKey": "$SUPABASE_KEY",
  "trainingParams": {
    "resolution": 512,
    "batchSize": 1,
    "maxTrainSteps": 500,
    "learningRate": 1e-4,
    "lrScheduler": "constant",
    "loraRank": 4
  }
}
EOL

echo "Created training input file: $TEST_DIR/training_input.json"

# Run the training script
echo "Starting LoRA training..."
python modal_scripts/train_kohya.py --input "$TEST_DIR/training_input.json" > "$TEST_DIR/training_log.txt" 2>&1

if [ $? -ne 0 ]; then
  echo "Training failed. Check $TEST_DIR/training_log.txt for details."
  exit 1
fi

echo "Training completed or started in the background."
echo "Check the status periodically using the check-model-status.js script:"
echo "node check-model-status.js $MODEL_ID"

# Wait for user confirmation before generation
echo ""
echo "Once training is completed, press ENTER to generate an image..."
read -p ""

# Create a test input JSON file for generation
cat > "$TEST_DIR/generation_input.json" << EOL
{
  "modelId": "$MODEL_ID",
  "prompt": "a photo of sks person in a field of flowers",
  "numInferenceSteps": 30,
  "guidanceScale": 7.5,
  "negativePrompt": "ugly, blurry, low quality, distorted",
  "seed": 12345,
  "outputPath": "$TEST_DIR/generation_result.json"
}
EOL

echo "Created generation input file: $TEST_DIR/generation_input.json"

# Run the generation script
echo "Starting image generation..."
python modal_scripts/generate_image.py --input "$TEST_DIR/generation_input.json" > "$TEST_DIR/generation_log.txt" 2>&1

if [ $? -ne 0 ]; then
  echo "Generation failed. Check $TEST_DIR/generation_log.txt for details."
  exit 1
fi

echo "Image generation completed."
echo "Results saved to: $TEST_DIR/generation_result.json"

# Extract the base64 image from the result
echo "Extracting generated image..."
python -c "
import json, base64
try:
    with open('$TEST_DIR/generation_result.json', 'r') as f:
        result = json.load(f)
    if 'image_base64' in result:
        img_data = base64.b64decode(result['image_base64'])
        with open('$TEST_DIR/generated_image.png', 'wb') as f:
            f.write(img_data)
        print('Image saved to $TEST_DIR/generated_image.png')
    else:
        print('No image data found in result')
except Exception as e:
    print(f'Error extracting image: {e}')
"

echo "Test workflow completed!" 