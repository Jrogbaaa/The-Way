import modal

# Define image with all dependencies
image = modal.Image.debian_slim(python_version="3.10").pip_install(
    "torch==2.0.1", 
    "torchvision==0.15.2",
    "diffusers==0.19.3",
    "transformers==4.30.2",
    "accelerate==0.20.3",
    "bitsandbytes==0.41.0",
    "peft==0.4.0",
)

app = modal.App("torch-test", image=image)

@app.function()
def test_torch():
    import torch
    return f"PyTorch version: {torch.__version__}, CUDA available: {torch.cuda.is_available()}"

if __name__ == "__main__":
    with app.run() as app_client:
        print(app_client.test_torch.remote()) 