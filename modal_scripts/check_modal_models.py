#!/usr/bin/env python3
"""
Script to list and check models stored in the Modal volume.
"""

import os
import json
import modal
from modal import Volume
import sys

# Constants
VOLUME_MOUNT_PATH = "/model-data"

# Initialize the Modal app
app = modal.App("model-checker")

# Create volume to store model data
volume = Volume.from_name("lora-models", create_if_missing=True)

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def list_models():
    """List all models stored in the Modal volume"""
    import os
    import json
    
    models = []
    
    print(f"Checking models in {VOLUME_MOUNT_PATH}")
    
    # List all directories in the volume
    if not os.path.exists(VOLUME_MOUNT_PATH):
        return {"error": f"Volume mount path {VOLUME_MOUNT_PATH} does not exist"}
    
    model_dirs = [d for d in os.listdir(VOLUME_MOUNT_PATH) 
                 if os.path.isdir(os.path.join(VOLUME_MOUNT_PATH, d))]
    
    print(f"Found {len(model_dirs)} model directories")
    
    for model_dir in model_dirs:
        model_path = os.path.join(VOLUME_MOUNT_PATH, model_dir)
        
        # Check for basic model structure
        lora_weights_path = os.path.join(model_path, "lora_weights")
        has_lora_weights = os.path.exists(lora_weights_path)
        
        # Check for model info file
        model_info_path = os.path.join(model_path, "model_info.json")
        model_info = None
        if os.path.exists(model_info_path):
            try:
                with open(model_info_path, 'r') as f:
                    model_info = json.load(f)
            except Exception as e:
                model_info = {"error": f"Failed to load model info: {str(e)}"}
        
        # Check for adapter model
        adapter_files = []
        if has_lora_weights:
            adapter_files = [f for f in os.listdir(lora_weights_path) 
                           if f.endswith(".safetensors") or f.endswith(".pt")]
        
        # Add model to the list
        models.append({
            "id": model_dir,
            "path": model_path,
            "has_lora_weights": has_lora_weights,
            "adapter_files": adapter_files,
            "model_info": model_info
        })
    
    return {"models": models}

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def check_model(model_id):
    """Check details of a specific model"""
    import os
    import json
    
    model_path = os.path.join(VOLUME_MOUNT_PATH, model_id)
    
    if not os.path.exists(model_path):
        return {"error": f"Model {model_id} not found"}
    
    print(f"Checking model: {model_id}")
    
    # List all files and directories in the model directory
    model_contents = {}
    for root, dirs, files in os.walk(model_path):
        rel_path = os.path.relpath(root, model_path)
        if rel_path == ".":
            rel_path = ""
        
        # Add directories
        for d in dirs:
            path = os.path.join(rel_path, d) if rel_path else d
            model_contents[path] = "directory"
        
        # Add files
        for f in files:
            path = os.path.join(rel_path, f) if rel_path else f
            file_size = os.path.getsize(os.path.join(root, f))
            model_contents[path] = f"file ({file_size} bytes)"
    
    # Check for model info file
    model_info_path = os.path.join(model_path, "model_info.json")
    model_info = None
    if os.path.exists(model_info_path):
        try:
            with open(model_info_path, 'r') as f:
                model_info = json.load(f)
        except Exception as e:
            model_info = {"error": f"Failed to load model info: {str(e)}"}
    
    return {
        "id": model_id,
        "path": model_path,
        "contents": model_contents,
        "model_info": model_info
    }

@app.local_entrypoint()
def main():
    """Main entry point for the script"""
    print("Listing all models...")
    result = list_models.remote()
    print("Listing all models:")
    for model in result.get("models", []):
        print(f"Model ID: {model['id']}")
        print(f"  Path: {model['path']}")
        print(f"  Has LoRA weights: {model['has_lora_weights']}")
        print(f"  Adapter files: {', '.join(model['adapter_files']) if model['adapter_files'] else 'None'}")
        print(f"  Model info: {json.dumps(model['model_info']) if model['model_info'] else 'None'}")
        print()
    
    if not result.get("models"):
        print("No models found or an error occurred.") 