#!/usr/bin/env python3
# Test script to directly call Modal for image generation

import os
import json
import tempfile
import modal

# Params for generation
model_id = "ma3ieno1ye86"  # The ID of our trained model
prompt = "a photo of sks test object in a field of flowers"
num_inference_steps = 30
guidance_scale = 7.5
negative_prompt = "ugly, blurry, low quality, distorted"
seed = 12345  # Fixed seed for reproducibility

def main():
    # Write params to a temporary file
    print(f"Testing image generation for model {model_id}")
    print(f"Prompt: {prompt}")
    
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
        tmp_path = tmp.name
        params = {
            "modelId": model_id,
            "prompt": prompt,
            "numInferenceSteps": num_inference_steps,
            "guidanceScale": guidance_scale,
            "negativePrompt": negative_prompt,
            "seed": seed
        }
        tmp.write(json.dumps(params).encode('utf-8'))
    
    try:
        print(f"Calling Modal generate_image function...")
        
        # Using modal.run to call the deployed function
        result = modal.run(
            "custom-image-model-generator::generate_image",
            model_id=model_id,
            prompt=prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            negative_prompt=negative_prompt,
            seed=seed
        )
        
        # Process the result
        print("Generation complete!")
        if result.get("status") == "success":
            # Save the generated image if available
            if "image_base64" in result:
                import base64
                img_data = base64.b64decode(result["image_base64"])
                output_path = "generated_image.png"
                with open(output_path, "wb") as f:
                    f.write(img_data)
                print(f"Image saved to {output_path}")
            else:
                print("No image data found in result")
        else:
            print(f"Generation failed: {result.get('error', 'Unknown error')}")
        
        # Print the full result
        print("\nFull result:")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error calling Modal: {e}")
    
    # Clean up
    try:
        os.unlink(tmp_path)
    except:
        pass

if __name__ == "__main__":
    main() 