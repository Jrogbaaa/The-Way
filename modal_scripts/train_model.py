import os
import time
import base64
import io
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import argparse

import modal
import torch
from PIL import Image

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
    os.makedirs(f"{VOLUME_MOUNT_PATH}/training_images", exist_ok=True)
    processed_paths = []
    
    for idx, img_data in enumerate(image_data_list):
        try:
            # Decode base64 image
            img_bytes = base64.b64decode(img_data['base64Data'])
            img = Image.open(io.BytesIO(img_bytes))
            
            # Resize to 512x512 (standard for Stable Diffusion)
            img = img.resize((512, 512), Image.LANCZOS)
            
            # Save processed image
            img_path = f"{VOLUME_MOUNT_PATH}/training_images/image_{idx}.png"
            img.save(img_path)
            processed_paths.append(img_path)
            
        except Exception as e:
            print(f"Error processing image {idx}: {str(e)}")
            continue
    
    return processed_paths

@app.function(gpu="T4", timeout=3600, volumes={VOLUME_MOUNT_PATH: volume})
def train_lora_model(
    processed_image_paths: List[str],
    instance_prompt: str,
    model_name: str,
    training_steps: int = 1000,
    learning_rate: float = 1e-4,
    progress_callback_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fine-tune a Stable Diffusion model using LoRA adapters
    
    Args:
        processed_image_paths: Paths to processed images
        instance_prompt: Text prompt describing the subject (e.g., "photo of sks person")
        model_name: Name for the generated model
        training_steps: Number of training steps
        learning_rate: Learning rate for training
        progress_callback_url: URL to report progress
        
    Returns:
        Dictionary with model information
    """
    try:
        print(f"Starting LoRA training for model: {model_name}")
        print(f"Using {len(processed_image_paths)} processed images")
        print(f"Instance prompt: {instance_prompt}")

        # Import necessary libraries within the function to ensure they're loaded on the GPU machine
        from diffusers import StableDiffusionPipeline
        from diffusers.optimization import get_scheduler
        from peft import LoraConfig, get_peft_model
        import torch
        from torch.utils.data import Dataset, DataLoader
        import requests
        
        # Set up paths
        output_dir = f"{VOLUME_MOUNT_PATH}/{model_name}"
        os.makedirs(output_dir, exist_ok=True)
        
        # Report progress
        def report_progress(step, total_steps, loss=None):
            progress = int((step / total_steps) * 100)
            message = f"Training progress: {progress}% complete"
            if loss:
                message += f", loss: {loss:.4f}"
                
            print(message)
            
            if progress_callback_url:
                try:
                    requests.post(
                        progress_callback_url,
                        json={"progress": progress, "message": message, "step": step, "total_steps": total_steps}
                    )
                except Exception as e:
                    print(f"Failed to report progress: {str(e)}")
        
        # Load base model
        base_model_id = "runwayml/stable-diffusion-v1-5"
        pipe = StableDiffusionPipeline.from_pretrained(
            base_model_id,
            torch_dtype=torch.float16,
        )
        
        # Configure LoRA
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
            
            # Get LoRA configuration with selected target modules
            lora_config = LoraConfig(
                r=16,  # rank
                lora_alpha=32,
                target_modules=target_modules,
                lora_dropout=0.1,
                bias="none",
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
                
            def __len__(self):
                return len(self.image_paths)
                
            def __getitem__(self, idx):
                image_path = self.image_paths[idx]
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
        
        # Create dataset and dataloader
        dataset = CustomImageDataset(
            processed_image_paths,
            pipe.tokenizer,
            instance_prompt
        )
        dataloader = DataLoader(dataset, batch_size=1, shuffle=True)
        
        # Prepare optimizer and scheduler
        optimizer = torch.optim.AdamW(
            unet.parameters(),
            lr=learning_rate,
        )
        
        lr_scheduler = get_scheduler(
            "constant",
            optimizer=optimizer,
            num_warmup_steps=0,
            num_training_steps=training_steps,
        )
        
        # Training loop
        unet.train()
        pipe.vae.to("cuda", dtype=torch.float16)
        pipe.text_encoder.to("cuda")
        unet.to("cuda", dtype=torch.float16)
        
        print(f"Starting training for {training_steps} steps")
        for step in range(training_steps):
            for batch in dataloader:
                pixel_values = batch["pixel_values"].to("cuda", dtype=torch.float16)
                input_ids = batch["input_ids"].to("cuda")
                
                # Get latents
                latents = pipe.vae.encode(pixel_values).latent_dist.sample() * 0.18215
                
                # Add noise
                noise = torch.randn_like(latents)
                noise_timestep = torch.randint(0, pipe.scheduler.config.num_train_timesteps, (1,)).to("cuda")
                noisy_latents = pipe.scheduler.add_noise(latents, noise, noise_timestep)
                
                # Get text embeddings
                encoder_hidden_states = pipe.text_encoder(input_ids)[0]
                
                # Predict noise
                noise_pred = unet(noisy_latents, noise_timestep, encoder_hidden_states).sample
                
                # Calculate loss
                loss = torch.nn.functional.mse_loss(noise_pred, noise)
                
                # Update weights
                loss.backward()
                optimizer.step()
                lr_scheduler.step()
                optimizer.zero_grad()
                
                # Report progress every 10 steps
                if step % 10 == 0:
                    report_progress(step, training_steps, loss.item())
                
                if step >= training_steps:
                    break
        
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
def main(input: str = None):
    """
    Local entrypoint for the train_model script.
    Handles command line arguments for input file.
    
    Args:
        input: Path to input JSON file containing training parameters
    """
    if not input:
        parser = argparse.ArgumentParser(description="Train a custom image model")
        parser.add_argument("--input", type=str, required=True, help="Path to input JSON file")
        args = parser.parse_args()
        input_file = args.input
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
        
        print(f"Starting training process for model: {model_name}")
        print(f"Instance prompt: {instance_prompt}")
        print(f"Number of images: {len(image_data_list)}")
        
        # Preprocess images - use remote() instead of call()
        processed_paths = preprocess_images.remote(image_data_list)
        print(f"Processed {len(processed_paths)} images")
        
        if not processed_paths:
            error_msg = "Failed to process any images"
            print(error_msg)
            return {"status": "error", "error": error_msg}
        
        # Train the model - use remote() instead of call()
        result = train_lora_model.remote(
            processed_paths,
            instance_prompt,
            model_name,
            training_steps,
            progress_callback_url=callback_url
        )
        
        print(f"Training completed with status: {result.get('status', 'unknown')}")
        return result
    
    except Exception as e:
        error_msg = f"Error processing training request: {str(e)}"
        print(error_msg)
        return {"status": "error", "error": error_msg} 