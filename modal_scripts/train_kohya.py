#!/usr/bin/env python3
"""
LoRA training script using Kohya_ss training backend in Modal.
"""

import os
import json
import argparse
import modal
import time
import glob
import base64
import io
import shutil
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional
import math
from modal import Image, Secret, Volume, Mount
from modal import web_endpoint, asgi_app
from modal import App, Stub

# Constants
VOLUME_MOUNT_PATH = "/model-data"

# Initialize the Modal app
app = App("lora-training")

# Create volume to store model data
volume = Volume.from_name("lora-models", create_if_missing=True)

# Secrets for external services
secrets = Secret.from_name("my-secrets")

# Define the Modal image with Kohya_ss and its dependencies
def setup_kohya_dependencies():
    import subprocess
    import os
    
    # Check if Kohya_ss repository already exists
    if os.path.exists("sd-scripts"):
        print("sd-scripts directory already exists, using existing installation")
    else:
        # Clone Kohya_ss repository
        subprocess.run(["git", "clone", "https://github.com/kohya-ss/sd-scripts.git"], check=True)
    
    os.chdir("sd-scripts")
    
    # Install dependencies
    subprocess.run(["pip", "install", "-r", "requirements.txt"], check=True)
    subprocess.run(["pip", "install", "torch==2.0.1", "torchvision==0.15.2", "--extra-index-url", "https://download.pytorch.org/whl/cu118"], check=True)
    subprocess.run(["pip", "install", "."], check=True)
    
    # Go back to the original directory
    os.chdir("..")

    # Install additional dependencies for API calls
    subprocess.run(["pip", "install", "supabase"], check=True)
    
    print("Kohya_ss setup completed")

# Define a custom image with Kohya and all dependencies
image = (
    modal.Image.debian_slim()
    .apt_install(["git", "wget", "build-essential", "libgl1"])
    .pip_install(["pillow", "numpy", "diffusers", "transformers", "huggingface-hub", "accelerate", "safetensors", "ftfy", "requests", "supabase"])
    .run_function(setup_kohya_dependencies)
)

# Function to update Supabase with training status
def update_supabase_status(model_id, status, error=None, model_url=None, model_info=None, sample_image=None):
    """Update the training status in Supabase using multiple fallback mechanisms"""
    print(f"Updating Supabase status for model {model_id} to {status}")
    
    success = False
    
    # Method 1: Try using the callback URL if provided
    try:
        callback_url = os.environ.get('CALLBACK_URL')
        if callback_url:
            print(f"Sending status update to callback URL: {callback_url}")
            import requests
            
            # Prepare the payload for the callback
            payload = {
                "id": model_id,
                "status": status
            }
            
            # Only add these fields if they're not None/NaN
            if error is not None:
                payload["error_message"] = error
                
            if model_url is not None:
                payload["model_url"] = model_url
                
            if model_info is not None:
                # Convert any non-serializable values in model_info
                sanitized_model_info = {}
                for key, value in model_info.items():
                    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                        sanitized_model_info[key] = str(value)
                    else:
                        sanitized_model_info[key] = value
                        
                payload["model_info"] = sanitized_model_info
                
            if sample_image is not None:
                payload["sample_image"] = sample_image
                
            # Check for NaN/None values throughout the payload
            for key in list(payload.keys()):
                if payload[key] is None:
                    del payload[key]
            
            print(f"Callback payload: {json.dumps({k: str(v) if isinstance(v, dict) else v for k, v in payload.items()})}")
                
            headers = {"Content-Type": "application/json"}
            response = requests.post(callback_url, json=payload, headers=headers)
            print(f"Callback response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                success = True
            else:
                print(f"Failed to update status via callback: {response.status_code} - {response.text}")
        else:
            print("No callback URL provided")
    except Exception as e:
        print(f"Error sending callback: {str(e)}")
    
    # Method 2: Try using the Supabase Python client if credentials are available
    if not success:
        try:
            supabase_url = os.environ.get('SUPABASE_URL')
            supabase_key = os.environ.get('SUPABASE_KEY')
            
            if supabase_url and supabase_key:
                print("Using Supabase Python client as fallback")
                from supabase import create_client
                
                # Connect to Supabase
                supabase = create_client(supabase_url, supabase_key)
                
                # Prepare the update data - only include fields that exist in the schema
                update_data = {"status": status}
                
                # Only add these fields if they're not None
                if error is not None:
                    update_data["error_message"] = error
                    
                if model_url is not None:
                    update_data["model_url"] = model_url
                    
                if model_info is not None:
                    # Sanitize model_info
                    sanitized_model_info = {}
                    for key, value in model_info.items():
                        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                            sanitized_model_info[key] = str(value)
                        else:
                            sanitized_model_info[key] = value
                            
                    update_data["model_info"] = sanitized_model_info
                    
                if sample_image is not None:
                    update_data["sample_image"] = sample_image
                
                # Log the payload for debugging
                print(f"Supabase Python client payload: {json.dumps(update_data)}")
                
                # Update the database
                result = supabase.table('trained_models').update(update_data).eq('id', model_id).execute()
                
                # Log the response for debugging
                print(f"Supabase Python client response: {result}")
                
                if result:
                    print(f"Successfully updated Supabase status directly via client: {status}")
                    success = True
            else:
                print("Supabase credentials not available for direct update")
        except Exception as e:
            print(f"Error updating Supabase directly: {str(e)}")
    
    return success

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def preprocess_images(model_id, image_data_list, instance_prompt):
    """Preprocess images for training"""
    import os
    import base64
    import requests
    from PIL import Image
    import io
    import json
    
    # Create a directory for the model data
    model_dir = f"{VOLUME_MOUNT_PATH}/{model_id}"
    os.makedirs(model_dir, exist_ok=True)
    print(f"Created model directory: {model_dir}")
    
    # Output directory for the processed images
    dataset_dir = os.path.join(model_dir, "train")
    os.makedirs(dataset_dir, exist_ok=True)
    
    # Metadata for the dataset
    metadata = []
    processed_count = 0
    
    # Log volume contents for debugging
    print(f"Volume contents: {os.listdir(VOLUME_MOUNT_PATH)}")
    
    # Process each image
    for i, image_data in enumerate(image_data_list):
        try:
            # Check if we have a base64 encoded image
            if "base64Data" in image_data and image_data["base64Data"]:
                # Decode the base64 data
                try:
                    encoded_data = image_data["base64Data"].split(",")[1]
                    img_data = base64.b64decode(encoded_data)
                except IndexError:
                    # Assume it's already base64 without data URL prefix
                    img_data = base64.b64decode(image_data["base64Data"])
                img = Image.open(io.BytesIO(img_data))
            # Check if we have a URL or file path
            elif "imageUrl" in image_data and image_data["imageUrl"]:
                image_url = image_data["imageUrl"]
                # Check if this is a local file path
                if image_url.startswith("http"):
                    # Download the image
                    response = requests.get(image_url, stream=True)
                    if response.status_code != 200:
                        print(f"Failed to download image {i} from {image_url}: {response.status_code}")
                        continue
                    img = Image.open(io.BytesIO(response.content))
                else:
                    # It's a local file path
                    try:
                        # Get the absolute path if it's relative
                        if not os.path.isabs(image_url):
                            # Check both the current directory and the mounted directory
                            if os.path.exists(image_url):
                                abs_path = os.path.abspath(image_url)
                            else:
                                print(f"Image file not found: {image_url}")
                                continue
                        else:
                            abs_path = image_url
                        
                        img = Image.open(abs_path)
                        
                        # Convert to base64 for storage
                        buffer = io.BytesIO()
                        img.save(buffer, format=img.format or "PNG")
                        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                        image_data["base64Data"] = f"data:image/{img.format.lower() if img.format else 'png'};base64,{img_base64}"
                    except Exception as e:
                        print(f"Failed to open local image {i} at {image_url}: {e}")
                        continue
            else:
                print(f"Skipping image {i}: No base64Data field or imageUrl field")
                continue
            
            # Save the image
            img_filename = f"{i:05d}.jpg"
            img_path = os.path.join(dataset_dir, img_filename)
            img.save(img_path, "JPEG")
            
            # Get the caption, defaulting to the instance prompt if not provided
            caption = image_data.get("caption", instance_prompt).strip()
            
            # Add to metadata
            metadata.append({
                "file_name": img_filename,
                "text": caption
            })
            
            processed_count += 1
            
        except Exception as e:
            print(f"Failed to process image {i}: {str(e)}")
    
    # Save the metadata
    metadata_file = os.path.join(model_dir, "metadata.jsonl")
    with open(metadata_file, "w") as f:
        for item in metadata:
            f.write(json.dumps(item) + "\n")
    
    print(f"Successfully processed {processed_count} images")
    return processed_count > 0, dataset_dir

@app.function(gpu="T4", volumes={VOLUME_MOUNT_PATH: volume}, secrets=[secrets])
def train_kohya_lora(input_data):
    """Train a LoRA model using Kohya_ss scripts"""
    import os
    import json
    import time
    import subprocess
    from pathlib import Path
    
    # Set up dependencies and environment
    setup_kohya_dependencies()
    
    # Extract parameters from input
    image_data_list = input_data.get("imageDataList", [])
    model_id = input_data.get("modelId")
    instance_prompt = input_data.get("instancePrompt", "")
    callback_url = input_data.get("callbackUrl")
    supabase_url = input_data.get("supabaseUrl")
    supabase_key = input_data.get("supabaseKey")
    model_name = input_data.get("modelName", "Untitled Model")
    
    # Extract training parameters with defaults
    training_params = input_data.get("trainingParams", {})
    resolution = training_params.get("resolution", 512)
    batch_size = training_params.get("batchSize", 1)
    max_train_steps = training_params.get("maxTrainSteps", 1000)
    learning_rate = training_params.get("learningRate", 1e-4)
    lr_scheduler = training_params.get("lrScheduler", "constant")
    lora_rank = training_params.get("loraRank", 4)
    
    # Set environment variables
    if callback_url:
        os.environ["CALLBACK_URL"] = callback_url
    
    if supabase_url:
        os.environ["SUPABASE_URL"] = supabase_url
        print(f"Supabase URL set: {supabase_url}")
    
    if supabase_key:
        os.environ["SUPABASE_KEY"] = supabase_key
        print(f"Supabase key set: {supabase_key[:5]}...")
    
    try:
        print(f"Starting training for model ID: {model_id}")
        print(f"Instance prompt: {instance_prompt}")
        
        # Update status to starting
        update_supabase_status(
            model_id=model_id,
            status="starting"
        )
        
        # Process images
        success, dataset_dir = preprocess_images.remote(model_id, image_data_list, instance_prompt)
        
        if not success:
            error_message = "No valid images were processed. Cannot proceed with training."
            print(f"WARNING: {error_message}")
            update_supabase_status(model_id, "failed", error=error_message)
            return {"success": False, "error": error_message}
        
        # Set up training directories
        model_dir = f"{VOLUME_MOUNT_PATH}/{model_id}"
        output_dir = f"{model_dir}/lora_weights"
        os.makedirs(output_dir, exist_ok=True)
        
        # Create config files needed for Kohya training
        
        # 1. Create the dataset config file
        dataset_config = {
            "datasets": [
                {
                    "resolution": resolution,
                    "min_bucket_reso": resolution,
                    "max_bucket_reso": resolution,
                    "batch_size": batch_size,
                    "flip_aug": False,
                    "color_aug": False,
                    "dataset_dirs": [
                        {
                            "image_dir": dataset_dir,
                            "class_tokens": instance_prompt
                        }
                    ]
                }
            ]
        }
        
        dataset_config_path = os.path.join(model_dir, "dataset_config.json")
        with open(dataset_config_path, "w") as f:
            json.dump(dataset_config, f, indent=2)
        
        # 2. Set up network config for LoRA
        network_config = {
            "network_module": "networks.lora",
            "network_args": {
                "conv_dim": 1,
                "conv_alpha": 1,
                "network_dim": lora_rank,
                "network_alpha": lora_rank,
                "network_weights": "",
                "network_dropout": 0.0,
                "module_dropout": 0.0
            }
        }
        
        network_config_path = os.path.join(model_dir, "network_config.json")
        with open(network_config_path, "w") as f:
            json.dump(network_config, f, indent=2)
            
        # Update status to training
        update_supabase_status(
            model_id=model_id,
            status="training",
            model_info={
                "currentStep": 0,
                "totalSteps": max_train_steps,
                "progress": 0
            }
        )
        
        # Run Kohya training script
        print(f"Starting Kohya training with {max_train_steps} steps")
        
        # Create a log file to capture output
        log_file_path = os.path.join(model_dir, "training_log.txt")
        
        # Prepare the command for accelerate launch
        train_command = [
            "accelerate", "launch", 
            "sd-scripts/train_network.py",
            "--pretrained_model_name_or_path=runwayml/stable-diffusion-v1-5",
            f"--output_dir={output_dir}",
            f"--logging_dir={os.path.join(model_dir, 'logs')}",
            f"--dataset_config={dataset_config_path}",
            f"--network_config={network_config_path}",
            "--train_batch_size=1",
            f"--resolution={resolution}",
            f"--learning_rate={learning_rate}",
            f"--lr_scheduler={lr_scheduler}",
            f"--max_train_steps={max_train_steps}",
            "--mixed_precision=fp16",
            "--save_every_n_steps=200",
            "--save_model_as=safetensors",
            "--enable_bucket",
            "--gradient_checkpointing",
            "--xformers"
        ]
        
        # Convert command to string for logging
        command_str = " ".join(train_command)
        print(f"Running training command:\n{command_str}")
        
        # Execute the training process
        process = subprocess.Popen(
            train_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Parse output to track progress
        current_step = 0
        with open(log_file_path, "w") as log_file:
            for line in process.stdout:
                # Write to log file
                log_file.write(line)
                log_file.flush()
                
                # Print to console
                print(line.strip())
                
                # Parse progress information
                if "global step" in line:
                    try:
                        # Extract step number
                        parts = line.split("global step")
                        if len(parts) > 1:
                            step_part = parts[1].strip().split()[0]
                            if step_part.isdigit():
                                current_step = int(step_part)
                                progress = min(100, int((current_step / max_train_steps) * 100))
                                
                                # Update status in Supabase
                                if current_step % 50 == 0 or current_step == max_train_steps:
                                    print(f"Progress update: Step {current_step}/{max_train_steps} ({progress}%)")
                                    update_supabase_status(
                                        model_id=model_id,
                                        status="training",
                                        model_info={
                                            "currentStep": current_step,
                                            "totalSteps": max_train_steps,
                                            "progress": progress
                                        }
                                    )
                    except Exception as e:
                        print(f"Error parsing progress: {e}")
        
        # Wait for the process to complete
        process.wait()
        
        # Check if training was successful
        if process.returncode != 0:
            error_message = f"Training process exited with code {process.returncode}"
            print(f"ERROR: {error_message}")
            update_supabase_status(model_id, "failed", error=error_message)
            return {"success": False, "error": error_message}
        
        # Find the final model file
        safetensors_files = glob.glob(os.path.join(output_dir, "*.safetensors"))
        if not safetensors_files:
            error_message = "Training completed but no model file was found"
            print(f"ERROR: {error_message}")
            update_supabase_status(model_id, "failed", error=error_message)
            return {"success": False, "error": error_message}
        
        # Get the latest model file
        latest_model_file = max(safetensors_files, key=os.path.getctime)
        
        # Rename the final model file to adapter_model.safetensors (used by generation script)
        final_model_path = os.path.join(output_dir, "adapter_model.safetensors")
        shutil.copy(latest_model_file, final_model_path)
        
        # Create adapter_config.json
        adapter_config = {
            "base_model_name_or_path": "runwayml/stable-diffusion-v1-5",
            "inference_mode": True,
            "modules_to_save": [],
            "lora_alpha": lora_rank,
            "lora_dropout": 0.0,
            "rank": lora_rank,
            "r": lora_rank,
            "bias": "none",
            "target_modules": [
                "to_q",
                "to_k",
                "to_v",
                "to_out.0",
                "conv1",
                "conv2"
            ],
            "peft_type": "LORA"
        }
        
        adapter_config_path = os.path.join(output_dir, "adapter_config.json")
        with open(adapter_config_path, "w") as f:
            json.dump(adapter_config, f, indent=2)
        
        # Create model_info.json with training details
        model_info = {
            "name": model_name,
            "instancePrompt": instance_prompt,
            "steps": max_train_steps,
            "resolution": resolution,
            "learningRate": learning_rate,
            "loraRank": lora_rank,
            "trainingCompleted": time.strftime("%Y-%m-%d %H:%M:%S"),
            "baseModel": "runwayml/stable-diffusion-v1-5"
        }
        
        model_info_path = os.path.join(model_dir, "model_info.json")
        with open(model_info_path, "w") as f:
            json.dump(model_info, f, indent=2)
        
        print(f"Training completed successfully. Model saved to: {final_model_path}")
        
        # Update status to completed
        update_supabase_status(
            model_id=model_id,
            status="completed",
            model_url=final_model_path,
            model_info=model_info
        )
        
        return {
            "success": True,
            "model_path": final_model_path,
            "model_id": model_id,
            "model_info": model_info
        }
        
    except Exception as e:
        error_message = f"Training failed: {str(e)}"
        print(f"ERROR: {error_message}")
        update_supabase_status(model_id, "failed", error=error_message)
        return {"success": False, "error": error_message}

@app.local_entrypoint()
def main(input=None):
    """Entry point for the application"""
    import json
    import os
    
    if not input:
        print("No input data provided")
        return
    
    try:
        if isinstance(input, str):
            # Check if it's a file path or a JSON string
            if os.path.exists(input):
                print(f"Processing input file: {input}")
                with open(input, 'r') as f:
                    data = json.load(f)
            else:
                print("Parsing input as JSON string")
                data = json.loads(input)
        else:
            data = input
        
        # Extract required parameters
        model_id = data.get("modelId")
        instance_prompt = data.get("instancePrompt", "")
        image_data_list = data.get("imageDataList", [])
        model_name = data.get("modelName", "Untitled Model")
        
        if not model_id:
            print("Error: Model ID is required")
            return
        
        if not instance_prompt:
            print("Error: Instance prompt is required")
            return
        
        # Train LoRA model
        result = train_kohya_lora.remote(data)
        
        print(f"Training completed with success: {result.get('success', False)}")
        
        # Check the result for errors
        if not result.get('success', False):
            error = result.get('error', 'Unknown error')
            print(f"Training failed: {error}")
            
            # Make one final attempt to update status if needed
            update_supabase_status(
                model_id,
                'failed',
                error=error
            )
        else:
            # Training succeeded - make a final status update
            model_path = result.get('model_path', '')
            print(f"Model saved to: {model_path}")
            
            # Make one final attempt to update status if needed
            update_supabase_status(
                model_id,
                'completed',
                model_url=model_path,
                model_info=result.get('model_info', {})
            )
        
        return result
        
    except Exception as e:
        print(f"Error processing input: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)} 