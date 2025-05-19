#!/usr/bin/env python3
"""
Simplified training script for Modal
"""

import os
import json
import argparse
import modal
import time
import glob
import base64
import io
from pathlib import Path
from typing import List, Dict, Any, Optional

# Define the Modal image with required dependencies
image = modal.Image.debian_slim().pip_install("pillow", "numpy")

# Define the Modal app
app = modal.App("custom-image-model-trainer-simple", image=image)

# Define persistent volume
volume = modal.Volume.from_name("model-training-data", create_if_missing=True)
VOLUME_MOUNT_PATH = "/model-data"

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def preprocess_images(image_data_list):
    """Process and validate training images"""
    from PIL import Image, ImageOps
    import numpy as np
    
    # Ensure training directory exists
    training_dir = f"{VOLUME_MOUNT_PATH}/training_images"
    os.makedirs(training_dir, exist_ok=True)
    
    # Log volume contents for debugging
    print(f"Volume contents: {os.listdir(VOLUME_MOUNT_PATH)}")
    
    processed_paths = []
    
    # Check if there's a lock file indicating another process is running
    lock_file = f"{VOLUME_MOUNT_PATH}/training.lock"
    if os.path.exists(lock_file):
        # Check if lock is stale (older than 2 hours)
        lock_time = os.path.getmtime(lock_file)
        current_time = time.time()
        if current_time - lock_time < 7200:  # 2 hours in seconds
            print(f"WARNING: Another training process may be running (lock file exists)")
        else:
            print(f"Removing stale lock file")
            os.remove(lock_file)
    
    # Create a lock file
    with open(lock_file, 'w') as f:
        f.write(f"Locked at {time.ctime()}")
    
    try:
        # Process each image
        for idx, img_data in enumerate(image_data_list):
            try:
                if 'base64Data' not in img_data:
                    print(f"Skipping image {idx}: No base64Data field")
                    continue
                
                # Decode base64 image
                img_bytes = base64.b64decode(img_data['base64Data'])
                img = Image.open(io.BytesIO(img_bytes))
                
                # Ensure RGB mode
                if img.mode not in ('RGB', 'RGBA'):
                    print(f"Converting image {idx} from {img.mode} to RGB")
                    img = img.convert("RGB")
                
                # Save the processed image
                img_path = f"{training_dir}/image_{idx}.png"
                img.save(img_path)
                
                # Verify the file was saved successfully
                if os.path.exists(img_path):
                    print(f"Successfully saved image: {img_path}")
                    processed_paths.append(img_path)
                else:
                    print(f"ERROR: Failed to save image to {img_path}")
            except Exception as e:
                print(f"Error processing image {idx}: {str(e)}")
                continue
        
        # Check for previously processed images if the current batch had issues
        if len(processed_paths) < 3 and image_data_list:
            print("Not enough images processed. Checking for existing images...")
            existing_images = glob.glob(f"{training_dir}/*.png")
            if existing_images:
                print(f"Found {len(existing_images)} existing images in training directory")
                processed_paths.extend([p for p in existing_images if p not in processed_paths])
        
        print(f"Successfully processed {len(processed_paths)} images")
        return processed_paths
    
    except Exception as e:
        print(f"Error in image preprocessing: {str(e)}")
        # Remove the lock file
        if os.path.exists(lock_file):
            os.remove(lock_file)
        return []
    finally:
        # Always try to remove the lock file when done
        try:
            if os.path.exists(lock_file):
                os.remove(lock_file)
        except:
            pass

@app.function(gpu="T4", volumes={VOLUME_MOUNT_PATH: volume})
def train_model(image_paths, instance_prompt, model_name, model_id=None):
    """Simple training function"""
    print(f"Training model {model_name} with prompt: {instance_prompt}")
    print(f"Using {len(image_paths)} images")
    print(f"Model ID for tracking: {model_id}")
    
    # Verify image files exist before training
    valid_paths = []
    for path in image_paths:
        if os.path.exists(path):
            valid_paths.append(path)
        else:
            print(f"WARNING: Image file not found: {path}")
    
    print(f"Found {len(valid_paths)} valid images out of {len(image_paths)}")
    
    if len(valid_paths) < 2:
        # As a fallback, check if there are any images in the training directory
        training_dir = f"{VOLUME_MOUNT_PATH}/training_images"
        if os.path.exists(training_dir):
            existing_images = glob.glob(f"{training_dir}/*.png")
            if existing_images:
                print(f"Using {len(existing_images)} existing images found in training directory")
                valid_paths = existing_images
    
    if len(valid_paths) < 2:
        return {
            "status": "error",
            "error": f"Not enough valid images found for training. Need at least 2, but found {len(valid_paths)}."
        }
    
    # Create model directory to store metadata
    model_dir = f"{VOLUME_MOUNT_PATH}/{model_id}"
    try:
        os.makedirs(model_dir, exist_ok=True)
        print(f"Created model directory: {model_dir}")
        
        # Store basic model info
        with open(f"{model_dir}/model_info.json", "w") as f:
            json.dump({
                "model_name": model_name,
                "instance_prompt": instance_prompt,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "image_count": len(valid_paths)
            }, f)
            
        # Note: In a real implementation, this would call a proper training function
        # with the validated image paths
        
    except Exception as e:
        print(f"Error creating model directory: {e}")
        return {
            "status": "error",
            "error": f"Error during model setup: {str(e)}"
        }
    
    # Create a dummy output (in a real implementation, this would be the actual model)
    return {
        "status": "success",
        "model_info": {
            "model_name": model_name,
            "instance_prompt": instance_prompt,
            "model_id": model_id,
            "image_count": len(valid_paths)
        },
        "sample_image_base64": ""
    }

@app.local_entrypoint()
def main(input=None, dry_run=False):
    """Local entrypoint with simpler implementation"""
    if not input:
        parser = argparse.ArgumentParser(description="Train a model (simplified)")
        parser.add_argument("--input", type=str, required=True, help="Path to input JSON file")
        parser.add_argument("--dry-run", type=str, help="Run in dry-run mode, pass 'true' to enable")
        args = parser.parse_args()
        input_file = args.input
        dry_run = args.dry_run == 'true'
    else:
        input_file = input
    
    print(f"Processing input file: {input_file}")
    
    try:
        # Read the input file
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        image_data_list = data.get('imageDataList', [])
        instance_prompt = data.get('instancePrompt', '')
        model_name = data.get('modelName', 'test-model')
        model_id = data.get('modelId', f'model-{int(time.time())}')
        
        print(f"Model ID from input data: {model_id}")
        
        # For dry runs, return immediately with success
        if dry_run:
            print("DRY RUN MODE: Simulating successful training")
            return {
                "status": "success",
                "message": "Dry run successful"
            }
        
        # Process images
        processed_paths = preprocess_images.remote(image_data_list)
        
        if not processed_paths:
            print("WARNING: No valid images processed. Cannot proceed with training.")
            return {
                "status": "error", 
                "error": "No valid images were processed. Please check your input images."
            }
        
        # Train model with model_id
        result = train_model.remote(processed_paths, instance_prompt, model_name, model_id)
        
        print(f"Training completed with status: {result.get('status', 'unknown')}")
        return result
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {"status": "error", "error": str(e)} 