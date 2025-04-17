# ComfyUI Setup Guide for The Way

This guide provides detailed instructions for setting up ComfyUI to work with The Way application's local inpainting feature.

## Prerequisites

- Python 3.10+ installed on your system
- Git installed
- 8GB+ RAM recommended
- GPU with 4GB+ VRAM for optimal performance (CPU-only mode will be slower)

## Installation Steps

### 1. Install ComfyUI

First, clone the ComfyUI repository and install its dependencies:

```bash
# Clone the repository
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI

# Optional but recommended: Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt
```

### 2. Download Required Models

ComfyUI needs specific model files to perform inpainting. For best results with The Way, you should download:

1. **SDXL Turbo** - Fast, high-quality generation:
   - Download `sd_xl_turbo_1.0_fp16.safetensors` from [Hugging Face](https://huggingface.co/stabilityai/sdxl-turbo)
   - Place in `ComfyUI/models/checkpoints/`

2. **Inpainting-specific model** (choose one):
   - `sd-v1-5-inpainting.ckpt` - Standard inpainting model
   - `512-inpainting-ema.safetensors` - Good for smaller inpainting areas

You can download these models manually from Hugging Face or Civitai, or use the ComfyUI Manager (recommended approach) as described below.

### 3. Install ComfyUI Manager

ComfyUI Manager makes it easy to install additional models and custom nodes:

```bash
# Navigate to the custom_nodes directory
cd ComfyUI/custom_nodes

# Clone the ComfyUI Manager repository
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
```

### 4. Start ComfyUI

Start the ComfyUI server:

```bash
# Navigate back to the ComfyUI root directory
cd ..

# Start ComfyUI
python main.py
```

ComfyUI will start and be accessible at: http://127.0.0.1:8188

### 5. Install Models via Manager

1. Open ComfyUI in your browser: http://127.0.0.1:8188
2. Click on the "Manager" button in the UI
3. Go to "Install Models" tab
4. Search for and install:
   - "sdxl_turbo" for general generation
   - "sd-v1-5-inpainting" for inpainting functionality

## Integration with The Way

The Way application is configured to communicate with ComfyUI at http://127.0.0.1:8188. The integration performs these steps:

1. The app sends images and masks to ComfyUI
2. ComfyUI processes the request using the inpainting model
3. The app retrieves and displays the results

### Testing the Integration

1. Ensure ComfyUI is running
2. Open The Way application
3. Upload an image
4. Select "ComfyUI Inpaint" from the editing options
5. Draw a mask and enter a prompt
6. Click "Generate with ComfyUI"

## Troubleshooting

### Common Issues

#### ComfyUI Connection Failed

**Symptom**: "Failed to connect to ComfyUI" error message

**Solution**:
- Ensure ComfyUI is running at http://127.0.0.1:8188
- Check if there's a firewall blocking the connection
- Verify ComfyUI server started without errors

#### Missing Model Error

**Symptom**: "Model not found" or "Checkpoint not found" errors

**Solution**:
- Make sure you've downloaded the required models
- Verify models are in the correct directory (`ComfyUI/models/checkpoints/`)
- Check model filenames match those in the workflow

#### Workflow Execution Error

**Symptom**: "Error executing workflow" message

**Solution**:
- Check ComfyUI console for specific error messages
- Ensure you have all required custom nodes installed
- Verify model compatibility with the workflow

### Testing ComfyUI Independently

To verify ComfyUI is working correctly:

1. Open ComfyUI UI at http://127.0.0.1:8188
2. Load the default workflow (click "Load default")
3. Change the model to one you have installed
4. Click "Queue Prompt" to test generation

## Advanced Configuration

### Customizing the Workflow

The default workflow in The Way uses a basic inpainting setup. Advanced users can customize this by:

1. Editing the workflow in `src/app/api/comfy/inpaint/route.ts`
2. Creating your own workflow in the ComfyUI interface
3. Exporting the workflow JSON
4. Replacing the workflow object in the route.ts file

### Using Different Models

To change the default inpainting model:

1. Open `src/app/api/comfy/inpaint/route.ts`
2. Find the CheckpointLoaderSimple node in the workflow
3. Update the `ckpt_name` parameter to your preferred model

## Additional Resources

- [ComfyUI Official Documentation](https://github.com/comfyanonymous/ComfyUI)
- [ComfyUI Manager Documentation](https://github.com/ltdrdata/ComfyUI-Manager)
- [The Way Photo Editor Troubleshooting](./photo-editor-troubleshooting.md) 