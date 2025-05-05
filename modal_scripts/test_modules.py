import torch
from diffusers import StableDiffusionPipeline

def main():
    # Load the model
    pipe = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float16,
    )
    
    # Get the UNet module structure
    module_names = [name for name, _ in pipe.unet.named_modules()]
    
    # Print modules that contain attention-related patterns
    attention_modules = [name for name in module_names if any(pattern in name for pattern in ['to_q', 'to_k', 'to_v', 'q_proj', 'k_proj', 'v_proj', 'attn'])]
    print("Attention-related modules:")
    for name in attention_modules[:20]:
        print(f"  - {name}")
    
    # Print suggested target modules
    if any("to_q" in name for name in module_names):
        print("\nSuggested target modules: [\"to_q\", \"to_k\", \"to_v\", \"to_out.0\"]")
    elif any("q_proj" in name for name in module_names):
        print("\nSuggested target modules: [\"q_proj\", \"k_proj\", \"v_proj\", \"out_proj\"]")
    else:
        print("\nSuggested fallback target modules: [\"conv_in\", \"conv_out\", \"time_emb_proj\"]")

if __name__ == "__main__":
    main() 