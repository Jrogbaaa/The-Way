#!/usr/bin/env python3
"""
Script to check a specific model stored in the Modal volume.
"""

import os
import json
import modal
import traceback
from modal import Volume
import sys

# Constants
VOLUME_MOUNT_PATH = "/model-data"

# Initialize the Modal app
app = modal.App("model-checker-specific")

# Create volume to store model data
volume = Volume.from_name("lora-models", create_if_missing=True)

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
        
        # Add files with more detailed information
        for f in files:
            file_path = os.path.join(root, f)
            path = os.path.join(rel_path, f) if rel_path else f
            file_size = os.path.getsize(file_path)
            
            # Additional checks for safetensors files
            if f.endswith('.safetensors'):
                try:
                    # Try to read the header of the file to check if it's valid
                    with open(file_path, 'rb') as sf:
                        # Read first 256 bytes to see if there's a valid header
                        header = sf.read(256)
                        is_binary = not all(c < 128 for c in header)
                        model_contents[path] = f"file ({file_size} bytes) - {'binary' if is_binary else 'text'} format"
                        
                        # Try to check header size
                        try:
                            # Import safetensors if available
                            try:
                                from safetensors import safe_open
                                with safe_open(file_path, framework="pt") as f:
                                    # This will raise an error if the header is too large
                                    metadata = f.metadata()
                                    model_contents[path] += f" - Valid safetensors file with metadata: {metadata}"
                            except ImportError:
                                model_contents[path] += " - couldn't verify format (safetensors not installed)"
                        except Exception as e:
                            model_contents[path] += f" - Error: {str(e)}"
                except Exception as e:
                    model_contents[path] = f"file ({file_size} bytes) - Error reading: {str(e)}"
            else:
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
    
    # Try to fix the safetensors file if it exists and is problematic
    lora_weights_path = os.path.join(model_path, "lora_weights")
    if os.path.exists(lora_weights_path):
        adapter_path = os.path.join(lora_weights_path, "adapter_model.safetensors")
        if os.path.exists(adapter_path):
            try:
                # Test if we can import diffusers and torch to check the file
                try:
                    import torch
                    from diffusers import StableDiffusionPipeline
                    print("Testing if model can be loaded with diffusers...")
                    
                    # Create a dummy pipeline to test loading the adapter
                    pipe = StableDiffusionPipeline.from_pretrained(
                        "runwayml/stable-diffusion-v1-5",
                        torch_dtype=torch.float16
                    )
                    
                    # Try loading the adapter
                    try:
                        pipe.unet.load_attn_procs(adapter_path)
                        print("Successfully loaded adapter with diffusers!")
                    except Exception as adapter_error:
                        print(f"Error loading adapter: {str(adapter_error)}")
                        print(f"Stack trace: {traceback.format_exc()}")
                except ImportError:
                    print("Diffusers or torch not available for testing")
            except Exception as e:
                print(f"Error testing adapter: {str(e)}")
    
    return {
        "id": model_id,
        "path": model_path,
        "contents": model_contents,
        "model_info": model_info
    }

@app.local_entrypoint()
def main(model_id):
    """Main entry point for the script"""
    print(f"Checking model: {model_id}")
    result = check_model.remote(model_id)
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Details for model: {result['id']}")
        print(f"Path: {result['path']}")
        print("\nModel contents:")
        for path, file_type in result['contents'].items():
            print(f"  {path}: {file_type}")
        
        print("\nModel info:")
        print(json.dumps(result['model_info'], indent=2) if result['model_info'] else "None") 