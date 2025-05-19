import os
import time
import base64
import io
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import argparse

import modal
# Import torch and other dependencies only inside the Modal functions where they're needed

# Define the Modal image with all necessary dependencies
image = modal.Image.debian_slim(python_version="3.10").pip_install(
    "torch==2.0.1", 
    "torchvision==0.15.2",
    "diffusers==0.19.3",
    "transformers==4.30.2",
    "accelerate==0.20.3",
    "bitsandbytes==0.41.0",
    "ftfy==6.1.1",
    "scipy==1.10.1",
    "safetensors==0.3.1",
    "huggingface_hub==0.15.1",
    "Pillow==9.5.0",
    "peft==0.4.0",
)

# Define the Modal app
app = modal.App("custom-image-model-trainer", image=image)

# Define persistent volume to store temporary data and models
volume = modal.Volume.from_name("model-training-data", create_if_missing=True)
VOLUME_MOUNT_PATH = "/model-data"

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def preprocess_images(image_data_list: List[Dict[str, Any]]) -> List[str]:
    """
    Preprocess uploaded images for training
    
    Args:
        image_data_list: List of dictionaries with base64 encoded images and metadata
        
    Returns:
        List of paths to processed images
    """
    # Import PIL inside the function where it's used
    from PIL import Image, ImageOps
    import numpy as np
    
    # Ensure directory exists and clear any previous images
    training_dir = f"{VOLUME_MOUNT_PATH}/training_images"
    os.makedirs(training_dir, exist_ok=True)
    
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
        # List existing files in directory for debugging
        existing_files = os.listdir(VOLUME_MOUNT_PATH)
        print(f"Files in volume root: {existing_files}")
        
        if os.path.exists(training_dir):
            try:
                dir_files = os.listdir(training_dir)
                print(f"Files in training directory: {dir_files}")
            except Exception as e:
                print(f"Error listing training directory: {str(e)}")
        
        processed_paths = []
        
        for idx, img_data in enumerate(image_data_list):
            try:
                # Decode base64 image
                img_bytes = base64.b64decode(img_data['base64Data'])
                img = Image.open(io.BytesIO(img_bytes))
                
                # Basic image validation
                if img.mode not in ('RGB', 'RGBA'):
                    print(f"Converting image {idx} from {img.mode} to RGB")
                    img = img.convert("RGB")
                
                if img.width < 256 or img.height < 256:
                    print(f"Warning: Image {idx} is too small ({img.width}x{img.height}), might give poor results")
                
                # Check for single-colored or low-variance images that might cause training issues
                img_array = np.array(img)
                if img_array.std() < 20:  # Very low standard deviation indicates near-uniform color
                    print(f"Warning: Image {idx} has very low variance, might cause training issues - skipping")
                    continue
                    
                # Center crop to square if needed
                if img.width != img.height:
                    size = min(img.width, img.height)
                    img = ImageOps.fit(img, (size, size), centering=(0.5, 0.5))
                
                # Resize to 512x512 (standard for Stable Diffusion) with antialiasing
                img = img.resize((512, 512), Image.LANCZOS)
                
                # Apply slight blur to reduce noise and improve stability
                from PIL import ImageFilter
                img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
                
                # Normalize image contrast for better stability
                img = ImageOps.autocontrast(img, cutoff=0.5)
                
                # Save processed image
                img_path = f"{training_dir}/image_{idx}.png"
                img.save(img_path)
                
                # Verify the file was saved
                if os.path.exists(img_path):
                    print(f"Successfully saved and verified image: {img_path}")
                    processed_paths.append(img_path)
                else:
                    print(f"ERROR: Failed to save image to {img_path}")
                
            except Exception as e:
                print(f"Error processing image {idx}: {str(e)}")
                continue
        
        # Check if we have too few images - try to find existing images that can be used
        if len(processed_paths) < 3:
            print("Not enough images processed successfully. Checking for existing images...")
            # Look for image files that might be in the training directory
            existing_images = [os.path.join(training_dir, f) for f in os.listdir(training_dir) 
                              if f.endswith(('.png', '.jpg', '.jpeg'))]
            if existing_images:
                print(f"Found {len(existing_images)} existing images that can be used")
                # Add only images that aren't already in processed_paths
                for img in existing_images:
                    if img not in processed_paths:
                        processed_paths.append(img)
        
        # List files in directory after processing to confirm they exist
        try:
            final_files = os.listdir(training_dir)
            print(f"Files in training directory after processing: {final_files}")
            print(f"Number of files listed in directory: {len(final_files)}")
            print(f"Number of processed paths: {len(processed_paths)}")
        except Exception as e:
            print(f"Error listing training directory after processing: {str(e)}")
        
        print(f"Successfully processed {len(processed_paths)} images out of {len(image_data_list)}")
        return processed_paths
    
    except Exception as e:
        print(f"Error in preprocessing: {str(e)}")
        return []
    finally:
        # Always try to remove the lock file when done
        try:
            if os.path.exists(lock_file):
                os.remove(lock_file)
        except:
            pass

@app.function(gpu="T4", timeout=3600, volumes={VOLUME_MOUNT_PATH: volume})
def train_lora_model(
    processed_image_paths: List[str],
    instance_prompt: str,
    model_name: str,
    training_steps: int = 1000,
    learning_rate: float = 5e-6,  # Reduced learning rate even further for stability
    progress_callback_url: Optional[str] = None,
    model_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fine-tune a Stable Diffusion model using LoRA adapters
    
    Args:
        processed_image_paths: Paths to processed images
        instance_prompt: Text prompt describing the subject (e.g., "photo of sks person")
        model_name: Name for the generated model
        training_steps: Number of training steps
        learning_rate: Learning rate for training (reduced for stability)
        progress_callback_url: URL to report progress
        model_id: ID of the model for progress tracking
        
    Returns:
        Dictionary with model information
    """
    try:
        print(f"Starting LoRA training for model: {model_name}")
        print(f"Using {len(processed_image_paths)} processed images")
        print(f"Instance prompt: {instance_prompt}")
        print(f"Learning rate: {learning_rate}")

        # Import necessary libraries within the function to ensure they're loaded on the GPU machine
        from diffusers import StableDiffusionPipeline
        from diffusers.optimization import get_scheduler
        from peft import LoraConfig, get_peft_model
        import torch
        import torch.nn.functional as F
        from torch.utils.data import Dataset, DataLoader
        import requests
        from PIL import Image
        import numpy as np
        
        # Enable TF32 precision on Ampere GPUs (for A100, A10, A6000, etc.)
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        
        # Set benchmark mode for improved performance
        torch.backends.cudnn.benchmark = True
        
        # Check volume persistence by examining the directory structure
        print(f"Checking volume persistence...")
        try:
            volume_contents = os.listdir(VOLUME_MOUNT_PATH)
            print(f"Volume contents: {volume_contents}")
            
            if "training_images" in volume_contents:
                training_dir = f"{VOLUME_MOUNT_PATH}/training_images"
                training_files = os.listdir(training_dir)
                print(f"Training directory contains {len(training_files)} files")
                
                if len(training_files) == 0:
                    print("WARNING: Training directory is empty!")
            else:
                print("WARNING: Training directory not found in volume!")
        except Exception as e:
            print(f"Error checking volume persistence: {str(e)}")

        # Validate images first - with enhanced error handling
        valid_image_paths = []
        for img_path in processed_image_paths:
            try:
                print(f"Checking image path: {img_path}")
                if os.path.exists(img_path):
                    print(f"  - File exists")
                    try:
                        with Image.open(img_path) as img:
                            width, height = img.size
                            print(f"  - Image loaded successfully: {width}x{height}")
                            valid_image_paths.append(img_path)
                    except Exception as img_err:
                        print(f"  - Failed to open image: {str(img_err)}")
                else:
                    print(f"  - File does not exist")
                    
                    # Try to find the file in common locations
                    alternate_path = os.path.basename(img_path)
                    training_dir = f"{VOLUME_MOUNT_PATH}/training_images"
                    alternate_full_path = os.path.join(training_dir, alternate_path)
                    
                    if os.path.exists(alternate_full_path):
                        print(f"  - Found file at alternate path: {alternate_full_path}")
                        valid_image_paths.append(alternate_full_path)
            except Exception as e:
                print(f"Error checking image {img_path}: {str(e)}")
        
        print(f"Validated {len(valid_image_paths)} images out of {len(processed_image_paths)}")
        
        # If we don't have enough valid images but the training directory has files,
        # try to use those files directly
        if len(valid_image_paths) < 2:
            training_dir = f"{VOLUME_MOUNT_PATH}/training_images"
            if os.path.exists(training_dir):
                try:
                    training_files = [os.path.join(training_dir, f) for f in os.listdir(training_dir) 
                                     if f.endswith(('.png', '.jpg', '.jpeg'))]
                    if len(training_files) >= 2:
                        print(f"Using {len(training_files)} files found directly in training directory")
                        valid_image_paths = training_files
                except Exception as e:
                    print(f"Error listing training directory: {str(e)}")
        
        if len(valid_image_paths) < 2:
            raise ValueError(f"Only {len(valid_image_paths)} valid images found. At least 2 are required for training.")
        
        # Continue with the validated image paths
        processed_image_paths = valid_image_paths
        
        # Set up paths
        output_dir = f"{VOLUME_MOUNT_PATH}/{model_name}"
        os.makedirs(output_dir, exist_ok=True)
        
        # Report progress
        def report_progress(step, total_steps, loss=None):
            progress = int((step / total_steps) * 100)
            progress_fraction = step / total_steps  # This is in 0-1 range for Supabase
            message = f"Training progress: {progress}% complete"
            if loss:
                message += f", loss: {loss:.4f}"
                
            print(message)
            
            if progress_callback_url:
                # Skip localhost URLs when running in Modal cloud to avoid connection errors
                if "localhost" in progress_callback_url or "127.0.0.1" in progress_callback_url:
                    print(f"Skipping localhost callback URL in cloud environment: {progress_callback_url}")
                    return
                    
                try:
                    # Create payload compatible with trained_models schema
                    # Only include fields that exist in the schema
                    # And sanitize any values that might cause serialization issues
                    import math
                    
                    payload = {
                        "modelId": model_id,
                        "status": "training",  # Use proper status value
                        "progress": progress_fraction,  # Use 0-1 range instead of percentage
                        "message": message
                    }
                    
                    # Only include loss if it's a valid number
                    if loss is not None and not (isinstance(loss, float) and math.isnan(loss)):
                        try:
                            # Convert loss to float and ensure it's serializable
                            loss_value = float(loss)
                            if not math.isnan(loss_value) and not math.isinf(loss_value):
                                # Store loss as part of model_info
                                payload["model_info"] = {
                                    "current_loss": loss_value,
                                    "current_step": step,
                                    "total_steps": total_steps
                                }
                        except (ValueError, TypeError) as e:
                            print(f"Error converting loss to float: {e}")
                    
                    # Log the payload being sent
                    print(f"Sending progress payload to callback URL: {json.dumps(payload)}")
                    
                    # Add timeout to prevent long waits
                    response = requests.post(
                        progress_callback_url,
                        json=payload,
                        timeout=5  # 5 second timeout
                    )
                    
                    # Log the response
                    print(f"Progress callback response status: {response.status_code}")
                    try:
                        if response.text:
                            print(f"Progress callback response body: {response.text}")
                    except Exception as resp_err:
                        print(f"Could not read response text: {str(resp_err)}")
                    
                    if response.status_code != 200:
                        print(f"WARNING: Unexpected status code {response.status_code} from progress callback")
                        
                        # If we get a 400 error, try a simplified payload
                        if response.status_code == 400:
                            print("Attempting simplified payload with only essential fields...")
                            minimal_payload = {
                                "modelId": model_id,
                                "status": "training",
                                "progress": progress_fraction
                            }
                            print(f"Sending minimal payload: {json.dumps(minimal_payload)}")
                            
                            simple_response = requests.post(
                                progress_callback_url,
                                json=minimal_payload,
                                timeout=5
                            )
                            
                            print(f"Simplified payload response: {simple_response.status_code} - {simple_response.text}")
                except Exception as e:
                    print(f"Failed to report progress: {str(e)}")
                    import traceback
                    traceback.print_exc()
        
        # Load base model
        base_model_id = "runwayml/stable-diffusion-v1-5"
        
        print(f"Loading base model: {base_model_id}")
        pipe = StableDiffusionPipeline.from_pretrained(
            base_model_id,
            torch_dtype=torch.float32,  # Use float32 for more stable training
            safety_checker=None,
            requires_safety_checker=False
        )
        
        # Configure LoRA with more conservative parameters
        # Attempt to detect correct modules for the model architecture
        try:
            # Try to inspect the architecture
            unet_modules = [name for name, _ in pipe.unet.named_modules()]
            
            # First check for transformer blocks which are present in SD
            if any("transformer_blocks" in name for name in unet_modules):
                target_modules = [
                    "to_q",
                    "to_k", 
                    "to_v", 
                    "to_out.0",
                    "proj_in",
                    "proj_out"
                ]
                print(f"Using SD UNet cross-attention target modules: {target_modules}")
            # Then check for direct attention components
            elif any("to_q" in name for name in unet_modules):
                target_modules = ["to_q", "to_k", "to_v", "to_out.0"]
                print(f"Using SD UNet attention target modules: {target_modules}")
            # For other transformer architectures
            elif any("q_proj" in name for name in unet_modules):
                target_modules = ["q_proj", "k_proj", "v_proj", "out_proj"]
                print(f"Using transformer target modules: {target_modules}")
            # Fallback to common SD pattern with convolutions
            else:
                target_modules = ["conv_in", "conv_out", "time_emb_proj"]
                print(f"Using fallback target modules: {target_modules}")
            
            # Get LoRA configuration with more conservative parameters
            lora_config = LoraConfig(
                r=4,  # Further reduced rank for stability (was 8)
                lora_alpha=8,  # Further reduced alpha for stability (was 16)
                target_modules=target_modules,
                lora_dropout=0.0,  # Remove dropout for more stable gradients
                bias="none",
                init_lora_weights="gaussian",  # Use gaussian initialization for better stability
            )
        except Exception as e:
            print(f"Error configuring LoRA: {str(e)}")
            raise
        
        # Apply LoRA to UNet
        unet = pipe.unet
        unet = get_peft_model(unet, lora_config)
        
        # Define dataset class for our images
        class CustomImageDataset(Dataset):
            def __init__(self, image_paths, tokenizer, instance_prompt):
                self.image_paths = image_paths
                self.tokenizer = tokenizer
                self.instance_prompt = instance_prompt
                # Verify image paths and filter out any that don't exist
                self.valid_image_paths = []
                for path in image_paths:
                    if os.path.exists(path):
                        self.valid_image_paths.append(path)
                    else:
                        print(f"Warning: Image file not found: {path} - skipping")
                
                if len(self.valid_image_paths) == 0:
                    raise ValueError("No valid images found for training. Please check your image paths.")
                
                print(f"Found {len(self.valid_image_paths)} valid images out of {len(image_paths)} total")
            
            def __len__(self):
                return len(self.valid_image_paths)
            
            def __getitem__(self, idx):
                try:
                    image_path = self.valid_image_paths[idx]
                    image = Image.open(image_path).convert("RGB")
                    # Transform image for model input
                    pixel_values = pipe.feature_extractor(
                        images=[image],
                        return_tensors="pt",
                    ).pixel_values
                    
                    # Encode text
                    text_inputs = self.tokenizer(
                        self.instance_prompt,
                        padding="max_length",
                        max_length=self.tokenizer.model_max_length,
                        truncation=True,
                        return_tensors="pt",
                    )
                    
                    return {
                        "pixel_values": pixel_values[0],
                        "input_ids": text_inputs.input_ids[0],
                    }
                except Exception as e:
                    print(f"Error loading image {self.valid_image_paths[idx]}: {str(e)}")
                    # If we encounter an error, use a fallback to the first valid image
                    if len(self.valid_image_paths) > 0 and idx != 0:
                        print(f"Using fallback image instead")
                        return self.__getitem__(0)  # Use the first image as fallback
                    else:
                        # Return dummy data to avoid crashing
                        print(f"Cannot load any valid images - using dummy data")
                        # Try to use blank image as fallback
                        try:
                            dummy_image = Image.new('RGB', (512, 512), color='white')
                            dummy_values = pipe.feature_extractor(
                                images=[dummy_image],
                                return_tensors="pt",
                            ).pixel_values
                            
                            text_inputs = self.tokenizer(
                                self.instance_prompt,
                                padding="max_length",
                                max_length=self.tokenizer.model_max_length,
                                truncation=True,
                                return_tensors="pt",
                            )
                            
                            return {
                                "pixel_values": dummy_values[0],
                                "input_ids": text_inputs.input_ids[0],
                            }
                        except:
                            # If all else fails, raise the error
                            raise
        
        # Create dataset and dataloader
        dataset = CustomImageDataset(
            processed_image_paths,
            pipe.tokenizer,
            instance_prompt
        )
        
        # Use a smaller batch size for more stable training
        batch_size = 1
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # Prepare optimizer with weight decay
        # Use AdamW with weight decay to prevent large weights
        from torch.optim import AdamW
        
        # Set different learning rates for different parts of the model
        param_groups = [
            {
                'params': [p for n, p in unet.named_parameters() if 'lora' in n],
                'lr': learning_rate,
                'weight_decay': 0.01  # Add weight decay to prevent overfitting
            }
        ]
        
        optimizer = AdamW(param_groups)
        
        # Use cosine scheduler with warmup for more stable training
        lr_scheduler = get_scheduler(
            "cosine",  # Changed from constant to cosine for better stability
            optimizer=optimizer,
            num_warmup_steps=int(training_steps * 0.1),  # 10% of steps for warmup
            num_training_steps=training_steps,
        )
        
        # Training loop
        unet.train()
        pipe.vae.to("cuda", dtype=torch.float32)  # Use float32 for VAE to avoid NaN
        pipe.text_encoder.to("cuda")
        unet.to("cuda", dtype=torch.float32)  # Use float32 for more stability
        
        # Add gradient clipping to avoid exploding gradients - reduced further
        max_grad_norm = 0.1  # Reduced from 0.5 for more aggressive clipping
        
        # Use learning rate warmup to stabilize training
        warmup_steps = int(training_steps * 0.1)  # 10% of total steps for warmup
        
        # For EMA tracking of loss
        ema_loss = None
        ema_alpha = 0.95
        
        # Stability enhancement: Use autocast to avoid numerical instability
        from torch.cuda.amp import autocast
        
        print(f"Starting training for {training_steps} steps (with {warmup_steps} warmup steps)")
        start_time = time.time()
        
        # Training loop
        for step, batch in enumerate(dataloader):
            # Skip this batch completely if we've exhausted our steps
            if step >= training_steps:
                break
            
            # Compute and apply warmup factor if within warmup period
            if step < warmup_steps:
                warmup_factor = step / warmup_steps
                optimizer.param_groups[0]["lr"] = learning_rate * warmup_factor
            
            # Get inputs
            try:
                # Move batch to GPU and handle potential errors with input batches
                pixel_values = batch["pixel_values"].to("cuda", dtype=torch.float32)
                input_ids = batch["input_ids"].to("cuda")
                
                # Make sure values are valid (no NaNs or infinities)
                if torch.isnan(pixel_values).any() or torch.isinf(pixel_values).any():
                    print(f"WARNING: NaN or Inf detected in pixel values, skipping this batch")
                    continue
            except Exception as e:
                print(f"Error processing batch: {e}")
                continue
            
            # Clear previous gradients
            optimizer.zero_grad()
            
            # Use autocast for better numerical stability
            with autocast():
                try:
                    # Get noise and noisy latents
                    noise = torch.randn_like(pipe.vae.encode(pixel_values).latent_dist.sample())
                    timesteps = torch.randint(
                        0, pipe.scheduler.config.num_train_timesteps, (batch["pixel_values"].shape[0],)
                    ).long().to("cuda")
                    noisy_latents = pipe.scheduler.add_noise(
                        pipe.vae.encode(pixel_values).latent_dist.sample(), noise, timesteps
                    )
                
                    # Get text embeddings
                    encoder_hidden_states = pipe.text_encoder(input_ids)[0]
                
                    # Get model prediction for the noise
                    noise_pred = unet(noisy_latents, timesteps, encoder_hidden_states).sample
                
                    # Check for NaN in intermediate values
                    if torch.isnan(noise_pred).any():
                        print(f"WARNING: NaN detected in UNet output at step {step}, skipping batch")
                        continue
                
                    # Calculate loss
                    loss = F.mse_loss(noise_pred, noise, reduction="mean")
                
                    # Additional check for loss validity
                    if torch.isnan(loss).any() or torch.isinf(loss).any():
                        print(f"WARNING: NaN or Inf loss detected (value: {loss.item()}), skipping this batch")
                        continue
                except Exception as e:
                    print(f"Error during forward pass: {e}")
                    continue
            
            # Update EMA loss for tracking
            if step == 0:
                ema_loss = loss.item()
            else:
                ema_loss = ema_loss * ema_alpha + loss.item() * (1 - ema_alpha)
            
            # Backward pass with error handling
            try:
                loss.backward()
                
                # Apply gradient clipping to avoid exploding gradients
                torch.nn.utils.clip_grad_norm_(unet.parameters(), max_grad_norm)
                
                optimizer.step()
                lr_scheduler.step()
            except Exception as e:
                print(f"Error during backward pass: {str(e)}")
                continue
            
            # Log progress at intervals
            if step % 10 == 0:
                elapsed = time.time() - start_time
                print(f"Step {step}/{training_steps} | Loss: {loss.item():.4f} | EMA Loss: {ema_loss:.4f} | Time: {elapsed:.2f}s")
        
        # Save the trained model
        print("Training complete, saving model")
        unet.save_pretrained(f"{output_dir}/unet")
        
        # Save model info
        model_info = {
            "model_name": model_name,
            "base_model": base_model_id,
            "instance_prompt": instance_prompt,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "training_steps": training_steps,
        }
        
        with open(f"{output_dir}/model_info.json", "w") as f:
            json.dump(model_info, f)
        
        # Generate sample image
        pipe.unet = unet
        
        sample_image = pipe(
            prompt=instance_prompt,
            num_inference_steps=30,
        ).images[0]
        
        sample_path = f"{output_dir}/sample.png"
        sample_image.save(sample_path)
        
        # Create ZIP archive of model
        import shutil
        zip_path = f"{output_dir}.zip"
        shutil.make_archive(output_dir, 'zip', output_dir)
        
        # Encode sample image to base64 for preview
        buffered = io.BytesIO()
        sample_image.save(buffered, format="PNG")
        sample_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "status": "success",
            "model_info": model_info,
            "sample_image_base64": sample_base64,
            "model_path": zip_path
        }
        
    except Exception as e:
        error_message = str(e)
        print(f"Error during model training: {error_message}")
        return {
            "status": "error",
            "error": error_message
        }

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def get_model_data(model_path: str) -> Dict[str, Any]:
    """
    Get model data after training
    
    Args:
        model_path: Path to the model directory
        
    Returns:
        Dictionary with model data
    """
    try:
        # Read model info
        with open(f"{model_path}/model_info.json", "r") as f:
            model_info = json.load(f)
        
        # Read sample image
        with open(f"{model_path}/sample.png", "rb") as f:
            sample_base64 = base64.b64encode(f.read()).decode()
        
        return {
            "status": "success",
            "model_info": model_info,
            "sample_image_base64": sample_base64
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.function(volumes={VOLUME_MOUNT_PATH: volume})
def cleanup_training_data(model_name: str) -> Dict[str, str]:
    """
    Clean up temporary training data
    
    Args:
        model_name: Name of the model
        
    Returns:
        Status message
    """
    try:
        import shutil
        temp_path = f"{VOLUME_MOUNT_PATH}/training_images"
        model_path = f"{VOLUME_MOUNT_PATH}/{model_name}"
        
        if os.path.exists(temp_path):
            shutil.rmtree(temp_path)
        
        return {"status": "success", "message": "Training data cleaned up"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.local_entrypoint()
def main(input: str = None, dry_run: bool = False):
    """
    Local entrypoint for the train_model script.
    Handles command line arguments for input file.
    
    Args:
        input: Path to input JSON file containing training parameters
        dry_run: If True, skip actual training and return simulated success (for testing)
    """
    if not input:
        parser = argparse.ArgumentParser(description="Train a custom image model")
        parser.add_argument("--input", type=str, required=True, help="Path to input JSON file")
        parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (skip actual training)")
        args = parser.parse_args()
        input_file = args.input
        dry_run = args.dry_run
    else:
        input_file = input
    
    print(f"Processing input file: {input_file}")
    
    # Read the input file
    try:
        with open(input_file, 'r') as f:
            training_data = json.load(f)
            
        # Extract parameters
        image_data_list = training_data.get('imageDataList', [])
        instance_prompt = training_data.get('instancePrompt', '')
        model_name = training_data.get('modelName', f'custom-model-{int(time.time())}')
        training_steps = training_data.get('trainingSteps', 1000)
        callback_url = training_data.get('callbackUrl')
        model_id = training_data.get('modelId')  # Get model ID for progress tracking
        
        print(f"Starting training process for model: {model_name}")
        print(f"Instance prompt: {instance_prompt}")
        print(f"Number of images: {len(image_data_list)}")
        
        # For dry runs, return success immediately without actual training
        if dry_run:
            print("DRY RUN MODE: Skipping actual training and returning simulated success")
            return {
                "status": "success",
                "model_info": {
                    "model_name": model_name,
                    "base_model": "runwayml/stable-diffusion-v1-5",
                    "instance_prompt": instance_prompt,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "training_steps": training_steps,
                },
                "sample_image_base64": None,  # No sample image in dry run
                "model_path": f"/tmp/simulated-model-{model_name}.zip"
            }
        
        # Preprocess images - use remote() instead of call()
        processed_paths = preprocess_images.remote(image_data_list)
        print(f"Processed {len(processed_paths)} images")
        
        # Check for minimum required images (at least 2 for training to be meaningful)
        if not processed_paths:
            error_msg = "Failed to process any images"
            print(error_msg)
            return {"status": "error", "error": error_msg}
        
        if len(processed_paths) < 2:
            error_msg = f"Only {len(processed_paths)} images were successfully processed. At least 2 images are required for training."
            print(error_msg)
            return {"status": "error", "error": error_msg}
            
        # Verify all image paths exist before starting training - but don't fail if they don't
        # The train_lora_model function will handle missing images more gracefully now
        valid_paths = []
        invalid_paths = []
        for path in processed_paths:
            if os.path.exists(path):
                valid_paths.append(path)
            else:
                print(f"Warning: Processed image not found at path: {path} - will try to locate during training")
                invalid_paths.append(path)
        
        print(f"Image validation: {len(valid_paths)} valid, {len(invalid_paths)} not found at expected paths")
        
        # Don't fail here - let the training function handle it
        # We'll pass all paths to the training function which now has logic to locate them
        
        print(f"Starting training with all processed image paths, the training function will validate them")
        
        # Start the training process with all paths - the train_lora_model function will handle validation
        result = train_lora_model.remote(
            processed_paths,  # Use all processed paths and let the training function validate
            instance_prompt,
            model_name,
            training_steps=training_steps,
            progress_callback_url=callback_url,
            model_id=model_id  # Pass model ID to the training function
        )
        
        print(f"Training completed with status: {result.get('status', 'unknown')}")
        return result
    
    except Exception as e:
        error_msg = f"Error processing training request: {str(e)}"
        print(error_msg)
        return {"status": "error", "error": error_msg} 