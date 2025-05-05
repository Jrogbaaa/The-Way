import base64
import json
import os
import sys
from PIL import Image
import io
import modal

# Import the app from our train_model.py
sys.path.append('modal_scripts')
from train_model import app, preprocess_images

def create_test_image():
    """Create a simple test image and encode it to base64"""
    # Create a sample 128x128 red image
    img = Image.new('RGB', (128, 128), color='red')
    
    # Save to a bytes buffer
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    
    # Get base64 string
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return img_base64

if __name__ == "__main__":
    print("Creating test image data...")
    img_base64 = create_test_image()
    
    # Create a simple dataset with one image
    image_data_list = [
        {
            "base64Data": img_base64,
            "name": "test_image.png",
            "type": "image/png"
        }
    ]
    
    print("Testing preprocess_images function...")
    with app.run():
        processed_paths = preprocess_images.remote(image_data_list)
        print(f"Processed paths: {processed_paths}")
    
    print("Test completed successfully!") 