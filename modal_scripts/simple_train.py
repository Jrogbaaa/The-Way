import os
import time
import json
import base64
import sys
from modal import Image, Volume, App, Mount

# Initialize Modal app and volume
app = App("lora-trainer")
volume = Volume.from_name("lora-models", create_if_missing=True)
VOLUME_MOUNT_PATH = "/model-data"

# Define the base image with Python
image = (
    Image.debian_slim()
    .pip_install(
        "pillow",
        "requests",
        "supabase"
    )
)

@app.function(image=image, volumes={VOLUME_MOUNT_PATH: volume})
def process_images(model_id, image_data_list, instance_prompt, supabase_url=None, supabase_key=None):
    """Process image data for training"""
    import os
    import requests
    from PIL import Image
    import io
    
    # Set Supabase credentials in this container
    if supabase_url:
        os.environ["SUPABASE_URL"] = supabase_url
    if supabase_key:
        os.environ["SUPABASE_KEY"] = supabase_key
    
    # Create directories
    model_dir = f"{VOLUME_MOUNT_PATH}/{model_id}"
    dataset_dir = os.path.join(model_dir, "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    
    print(f"Processing images for model {model_id}")
    print(f"Got {len(image_data_list)} images to process")
    
    # Update status to processing
    update_status(model_id, "processing")
    
    successful_images = 0
    
    # Process each image in the image_data_list
    for i, img_data in enumerate(image_data_list):
        try:
            img_path = img_data.get("imageUrl")
            if not img_path:
                print(f"Image {i} missing imageUrl field")
                continue
                
            # For debugging
            print(f"Processing image {i+1}/{len(image_data_list)}: {img_path}")
                
            if img_path.startswith("http"):
                # Download the image
                response = requests.get(img_path, stream=True)
                if response.status_code != 200:
                    print(f"Failed to download image {i} from {img_path}: {response.status_code}")
                    continue
                img = Image.open(io.BytesIO(response.content))
            else:
                # Local path - skip for Modal (paths won't exist in container)
                print(f"Local path detected: {img_path} - this won't be accessible in Modal")
                continue
            
            # Save the image
            output_path = os.path.join(dataset_dir, f"image_{i:03d}.jpg")
            img.save(output_path)
            
            # Save the caption
            caption = img_data.get("caption", instance_prompt).strip()
            caption_path = os.path.join(dataset_dir, f"image_{i:03d}.txt")
            with open(caption_path, "w") as f:
                f.write(caption)
                
            successful_images += 1
            print(f"Processed image {i+1}/{len(image_data_list)}: {img_path} → {output_path}")
            
        except Exception as e:
            print(f"Error processing image {i}: {e}")
    
    print(f"Successfully processed {successful_images} out of {len(image_data_list)} images")
    
    if successful_images == 0:
        update_status(model_id, "failed", error="No images could be processed")
        return False
        
    return True

@app.function(image=image, volumes={VOLUME_MOUNT_PATH: volume})
def train_model(model_id, instance_prompt, supabase_url=None, supabase_key=None):
    """Simulate training a model (for testing)"""
    import os
    import time
    import json
    
    # Set Supabase credentials
    if supabase_url:
        os.environ["SUPABASE_URL"] = supabase_url
    if supabase_key:
        os.environ["SUPABASE_KEY"] = supabase_key
    
    model_dir = f"{VOLUME_MOUNT_PATH}/{model_id}"
    output_path = os.path.join(model_dir, "trained_model.safetensors")
    
    print(f"Starting training for model {model_id}")
    print(f"Instance prompt: {instance_prompt}")
    
    # Simulate training progress
    total_steps = 5  # Short training for testing
    for step in range(1, total_steps + 1):
        progress = (step / total_steps) * 100
        print(f"Training progress: {progress:.1f}% (Step {step}/{total_steps})")
        time.sleep(1)  # Short delay for testing
        
        # Update status
        update_status(model_id, "training", progress=progress/100)
    
    # Create a dummy model file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        f.write(f"Trained model for {instance_prompt}")
    
    # Create the lora_weights directory structure
    lora_dir = os.path.join(model_dir, "lora_weights")
    os.makedirs(lora_dir, exist_ok=True)
    
    # Copy the model file to the lora_weights directory
    lora_model_path = os.path.join(lora_dir, "adapter_model.safetensors")
    with open(lora_model_path, "w") as f:
        f.write(f"Trained model for {instance_prompt}")
    
    # Create the adapter_config.json file that the LoRA model expects
    adapter_config_path = os.path.join(lora_dir, "adapter_config.json")
    adapter_config = {
        "base_model_name_or_path": "runwayml/stable-diffusion-v1-5",
        "inference_mode": True,
        "modules_to_save": [],
        "lora_alpha": 0.75,
        "lora_dropout": 0.0,
        "rank": 4,
        "r": 4,
        "bias": "none",
        "target_modules": [
            "to_q",
            "to_k",
            "to_v",
            "to_out.0"
        ],
        "peft_type": "LORA"
    }
    with open(adapter_config_path, "w") as f:
        json.dump(adapter_config, f, indent=2)
    
    # Create a model_info.json file
    model_info_path = os.path.join(model_dir, "model_info.json")
    model_info = {
        "instance_prompt": instance_prompt,
        "training_steps": total_steps,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model_id": model_id
    }
    with open(model_info_path, "w") as f:
        json.dump(model_info, f, indent=2)
    
    print(f"Training completed, model saved to {output_path}")
    update_status(model_id, "completed", model_url=output_path)
    
    return {"success": True, "model_path": output_path}

def update_status(model_id, status, progress=None, model_url=None, error=None):
    """Update the model status in Supabase"""
    import os
    import json
    import requests
    
    # URL and key should be passed via environment variables
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Missing Supabase credentials, cannot update status")
        return False
    
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        # Prepare update data
        update_data = {"status": status}
        
        if progress is not None:
            # Convert to integer percentage (0-100)
            if isinstance(progress, float) and 0 <= progress <= 1:
                update_data["progress"] = int(progress * 100)
            else:
                # Assume it's already an integer percentage
                update_data["progress"] = int(progress)
        
        if model_url is not None:
            update_data["model_url"] = model_url
        
        if error is not None:
            update_data["error_message"] = error
        
        # Log the update
        print(f"Updating status for model {model_id}: {json.dumps(update_data)}")
        
        # Update the database
        result = supabase.table("trained_models").update(update_data).eq("id", model_id).execute()
        print(f"Update result: {result}")
        
        return True
    except Exception as e:
        print(f"Error updating status: {e}")
        return False

@app.local_entrypoint()
def main(input=None):
    """Entry point for the application"""
    import json
    import os
    
    if not input:
        print("No input provided")
        return
    
    try:
        # Load input data
        if os.path.exists(input):
            print(f"Reading input file: {input}")
            with open(input, "r") as f:
                data = json.load(f)
        else:
            print("Input is not a file, parsing as JSON")
            data = json.loads(input)
        
        # Extract parameters
        model_id = data.get("modelId")
        instance_prompt = data.get("instancePrompt", "")
        image_data_list = data.get("imageDataList", [])
        
        # Get Supabase credentials
        supabase_url = data.get("supabaseUrl", "")
        supabase_key = data.get("supabaseKey", "")
        
        # Set env variables locally
        os.environ["SUPABASE_URL"] = supabase_url
        os.environ["SUPABASE_KEY"] = supabase_key
        
        if not model_id:
            print("Error: modelId is required")
            return {"success": False, "error": "modelId is required"}
        
        if not image_data_list:
            print("No images found in input data")
            return {"success": False, "error": "No images provided"}
        
        # Process images
        success = process_images.remote(model_id, image_data_list, instance_prompt, supabase_url, supabase_key)
        
        if not success:
            print("Image processing failed")
            update_status(model_id, "failed", error="Image processing failed")
            return {"success": False, "error": "Image processing failed"}
        
        # Train model - pass credentials
        result = train_model.remote(
            model_id, 
            instance_prompt,
            supabase_url=supabase_url,
            supabase_key=supabase_key
        )
        
        print(f"Training completed: {json.dumps(result)}")
        return result
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        
        # Try to update status if model_id is defined
        if 'model_id' in locals() and model_id:
            update_status(model_id, "failed", error=str(e))
        
        return {"success": False, "error": str(e)} 