#!/usr/bin/env python
"""
Image generation script for LoRA fine-tuned models.
"""

import os
import io
import json
import base64
import time
import argparse
import sys
import traceback
from typing import Dict, Any, Optional, List
import modal
from PIL import Image
import torch
# Important fix: Use explicitly pinned versions for diffusers
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from safetensors.torch import load_file

# Set up Modal volume for persistent storage
VOLUME_MOUNT_PATH = "/model-data"
volume = modal.Volume.from_name("lora-models", create_if_missing=True)
app = modal.App("custom-image-model-generator")

# Base model to use with LoRA
BASE_MODEL = "runwayml/stable-diffusion-v1-5"

# Define a custom image with required dependencies
image = modal.Image.debian_slim().pip_install(
    "diffusers>=0.25.0",  # Updated to newer version
    "transformers>=4.30.0",
    "torch>=2.0.0",
    "accelerate>=0.20.0",
    "huggingface_hub>=0.20.0",  # Updated to newer version with split_torch_state_dict_into_shards
    "peft>=0.4.0",
    "pillow",
    "numpy",
    "ftfy",
    "safetensors"
)

@app.function(
    gpu="T4", 
    timeout=600, 
    volumes={VOLUME_MOUNT_PATH: volume},
    image=image  # Use the custom image with all dependencies
)
def generate_image(
    model_id: str,
    prompt: str,
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
    negative_prompt: str = "ugly, blurry, low quality, distorted",
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate an image using a LoRA fine-tuned model
    
    Args:
        model_id: ID of the LoRA model to use
        prompt: Text prompt for image generation
        num_inference_steps: Number of diffusion steps (default 30)
        guidance_scale: Classifier-free guidance scale (default 7.5)
        negative_prompt: Text describing what to avoid in the image
        seed: Random seed for reproducibility
        
    Returns:
        Dictionary with generation results and image data
    """
    
    try:
        print(f"Starting image generation for model {model_id}")
        # Create seed if none provided
        if seed is None:
            seed = int(time.time()) % 1000000
            print(f"No seed provided, using random seed: {seed}")
        
        # Set the random seed for reproducibility
        generator = torch.Generator("cuda").manual_seed(seed)
        
        # Ensure model directory exists
        model_dir = os.path.join(VOLUME_MOUNT_PATH, model_id)
        if not os.path.exists(model_dir):
            return {
                "status": "error",
                "error": f"Model directory not found for ID: {model_id}",
                "model_id": model_id
            }
        
        # Check for the adapter model
        adapter_model_path = os.path.join(model_dir, "trained_model")
        adapter_config_path = os.path.join(model_dir, "adapter_config.json")
        
        if not os.path.exists(adapter_model_path):
            return {
                "status": "error",
                "error": f"Adapter model not found at {adapter_model_path}",
                "model_id": model_id
            }
        
        # Load adapter config if available
        adapter_config = None
        if os.path.exists(adapter_config_path):
            with open(adapter_config_path, "r") as f:
                adapter_config = json.load(f)
            print("Loaded adapter configuration")
        
        # Load the base model
        print(f"Loading base model: {BASE_MODEL}")
        pipe = StableDiffusionPipeline.from_pretrained(
            BASE_MODEL, 
            torch_dtype=torch.float16,
            safety_checker=None  # Disable safety checker for custom models
        )

        # Use DPMSolver for faster inference with better quality
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        
        # Move to GPU
        pipe.to("cuda")
        
        # Load the adapter weights
        print(f"Loading LoRA weights from {adapter_model_path}")
        pipe.unet.load_attn_procs(adapter_model_path)
        
        # Generate the image
        print(f"Generating image with prompt: {prompt}")
        start_time = time.time()
        
        # Adjust prompts based on instance_prompt if needed
        model_info_path = os.path.join(model_dir, "model_info.json")
        instance_prompt = None
        if os.path.exists(model_info_path):
            with open(model_info_path, "r") as f:
                model_info = json.load(f)
                instance_prompt = model_info.get("instancePrompt")
        
        # Prepare final prompt (replace 'sks' token if present)
        final_prompt = prompt
        if instance_prompt and "sks" in instance_prompt:
            concept_token = instance_prompt.split()[instance_prompt.split().index("sks") + 1]
            if "sks" in prompt:
                final_prompt = prompt.replace("sks", "")
                
        # Generate the image
        with torch.autocast("cuda"):
            image = pipe(
                final_prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator
            ).images[0]
        
        generation_time = time.time() - start_time
        print(f"Image generated in {generation_time:.2f} seconds")
        
        # Convert to base64 for API response
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Return results
        return {
            "status": "success",
            "image_base64": img_str,
            "prompt": prompt,
            "final_prompt": final_prompt,
            "seed": seed,
            "steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "generation_time": f"{generation_time:.2f}s"
        }
        
    except Exception as e:
        error_message = str(e)
        print(f"Error during image generation: {error_message}")
        return {
            "status": "error",
            "error": error_message,
            "traceback": traceback.format_exc() if 'traceback' in sys.modules else None
        }

@app.local_entrypoint()
def main(input: str = None):
    """
    Local entrypoint for the generate_image script.
    Handles command line arguments for input file.
    
    Args:
        input: Path to input JSON file containing generation parameters
    """
    if not input:
        parser = argparse.ArgumentParser(description="Generate images with a custom model")
        parser.add_argument("--input", type=str, required=True, help="Path to input JSON file")
        args = parser.parse_args()
        input_file = args.input
    else:
        input_file = input
    
    print(f"Processing input file: {input_file}")
    
    # Read the input file
    try:
        with open(input_file, 'r') as f:
            generation_data = json.load(f)
            
        # Extract parameters
        model_id = generation_data.get('modelId', '')
        prompt = generation_data.get('prompt', '')
        num_inference_steps = generation_data.get('numInferenceSteps', 30)
        guidance_scale = generation_data.get('guidanceScale', 7.5)
        negative_prompt = generation_data.get('negativePrompt', 'ugly, blurry, low quality, distorted')
        seed = generation_data.get('seed')
        output_path = generation_data.get('outputPath')
        
        print(f"Starting image generation for model: {model_id}")
        print(f"Prompt: {prompt}")
        
        # Generate the image
        result = generate_image.remote(
            model_id,
            prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            negative_prompt=negative_prompt,
            seed=seed
        )
        
        # Write output to file if specified
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)
        
        print(f"Generation completed with status: {result.get('status', 'unknown')}")
        return result
    
    except Exception as e:
        error_msg = f"Error processing generation request: {str(e)}"
        print(error_msg)
        return {"status": "error", "error": error_msg} 