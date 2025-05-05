import base64
import json
import os
import sys
from PIL import Image
import io
import modal
import argparse

# Import from train_model
sys.path.append('modal_scripts')
from train_model import app, preprocess_images, train_lora_model, cleanup_training_data

def create_test_image():
    """Create a simple test image and encode it to base64"""
    # Create a sample 512x512 gradient image
    img = Image.new('RGB', (512, 512), color='white')
    
    # Draw a simple pattern
    for x in range(512):
        for y in range(512):
            r = int(255 * (x / 512))
            g = int(255 * (y / 512))
            b = 100
            img.putpixel((x, y), (r, g, b))
    
    # Save to a bytes buffer
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    
    # Get base64 string
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return img_base64

def main(steps=10):
    print("Creating test image data...")
    img_base64 = create_test_image()
    
    # Create a dataset with one image
    image_data_list = [
        {
            "base64Data": img_base64,
            "name": "test_image.png",
            "type": "image/png"
        }
    ]
    
    # Define model parameters
    instance_prompt = "photo of sks gradient"
    model_name = "test-gradient-model"
    training_steps = steps  # Very small number for quick testing
    
    print(f"Testing full workflow with {training_steps} training steps...")
    print("This will take a few minutes...")
    
    try:
        with app.run():
            # Step 1: Preprocess images
            print("Step 1: Preprocessing images...")
            processed_paths = preprocess_images.remote(image_data_list)
            print(f"Processed paths: {processed_paths}")
            
            # Step 2: Train model
            print(f"Step 2: Training model with {training_steps} steps...")
            result = train_lora_model.remote(
                processed_paths,
                instance_prompt,
                model_name,
                training_steps
            )
            print("Training complete!")
            print(f"Result: {json.dumps(result, indent=2)}")
            
            # Step 3: Clean up
            print("Step 3: Cleaning up...")
            cleanup_result = cleanup_training_data.remote(model_name)
            print(f"Cleanup result: {cleanup_result}")
        
        print("Test completed successfully!")
        return result
    except Exception as e:
        print(f"Error during test: {str(e)}")
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the full model training workflow")
    parser.add_argument("--steps", type=int, default=10, help="Number of training steps")
    args = parser.parse_args()
    
    main(steps=args.steps) 