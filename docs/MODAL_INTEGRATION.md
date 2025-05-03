# Modal Integration for Custom Model Training

This document explains how Modal is integrated into the application for training custom image generation models.

## Overview

[Modal](https://modal.com/) is a Python cloud serverless framework that provides on-demand GPU-accelerated compute resources. We use Modal to train custom image generation models with Stable Diffusion and LoRA fine-tuning.

## Setup Instructions

### 1. Create Python Virtual Environment

```bash
# Create a virtual environment
python3 -m venv modal-env

# Activate the virtual environment
# On macOS/Linux:
source modal-env/bin/activate
# On Windows:
# .\modal-env\Scripts\activate
```

### 2. Install Dependencies

```bash
# Install Modal and other required packages
pip install modal torch==2.0.1 torchvision==0.15.2 diffusers==0.19.3 transformers==4.30.2 accelerate==0.20.3 bitsandbytes==0.41.0 peft==0.4.0
```

### 3. Authenticate with Modal

```bash
# Set up Modal auth
python -m modal setup
```

Follow the browser-based authentication flow.

### 4. Create Persistent Volume

```bash
# Create a persistent volume for model data
python -c "import modal; volume = modal.Volume.from_name('model-training-data', create_if_missing=True)"
```

## Running Modal

### Starting the Modal Server

To use the Modal integration, you need to have the Modal server running in a separate terminal:

```bash
# Navigate to project directory
cd /path/to/project

# Activate virtual environment
source modal-env/bin/activate

# Start Modal server
python -m modal serve modal_scripts/train_model.py
```

You should see output like:
```
✓ Created app: custom-image-model-trainer (stable)
Serving custom-image-model-trainer.preprocess_images, custom-image-model-trainer.train_lora_model, custom-image-model-trainer.get_model_data, custom-image-model-trainer.cleanup_training_data ... (press Ctrl+C to quit)
```

Keep this terminal window open while using the application.

## Integration Architecture

### Python Scripts

- `modal_scripts/train_model.py`: Main Modal script that handles image preprocessing, model training, and result handling.

### Next.js API Routes

- `/api/model/create`: Creates a new model training job
- `/api/modal/model-status/[modelId]`: Gets the status of a training job
- `/api/modal/training-progress`: Webhook for progress updates during training

### Frontend Components

- `ModalModelCreation.tsx`: React component for the model creation form
- `modalService.ts`: Service for interacting with Modal API routes

## Debugging Common Issues

### 500 Server Error on Status Check

If you encounter a 500 error when checking model status:

1. Ensure the Modal server is running (`python -m modal serve modal_scripts/train_model.py`)
2. Check logs in both Next.js and Modal terminal windows
3. Verify Supabase connection and schema are correctly set up
4. Check the `trained_models` table has all required columns:
   - `id`
   - `user_id`
   - `model_name`
   - `status`
   - `error_message`
   - `progress`
   - `model_info`
   - `sample_image`
5. Verify the NextJS API routes are correctly handling async params in dynamic routes:
   ```typescript
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ modelId: string }> }
   ) {
     try {
       // Properly await params
       const { modelId } = await params;
       
       // Rest of the code...
     }
   }
   ```

### LoRA Training Failures

If model training starts but fails with "Target modules not found":

1. The error "Target modules ['q_proj', 'k_proj', 'v_proj', 'out_proj'] not found in the base model" indicates that the LoRA configuration is using target module names that don't match the architecture of the model.

2. The current implementation in `train_model.py` handles this by dynamically detecting available modules:
   ```python
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
   # Then check for direct attention components
   elif any("to_q" in name for name in unet_modules):
       target_modules = ["to_q", "to_k", "to_v", "to_out.0"]
   # For other transformer architectures
   elif any("q_proj" in name for name in unet_modules):
       target_modules = ["q_proj", "k_proj", "v_proj", "out_proj"]
   # Fallback to common SD pattern with convolutions
   else:
       target_modules = ["conv_in", "conv_out", "time_emb_proj"]
   ```

3. If you encounter this error, make sure your Modal server is running the latest version of `train_model.py`.

### Image Upload Issues

If image uploads are failing:

1. Ensure images are standard formats (JPEG, PNG)
2. Keep images under 5MB each
3. Verify images are actually getting to the server by checking network requests

## Troubleshooting

### Reset Modal Deployment

If you need to reset Modal:

```bash
# Remove local Modal deployment
rm -rf ~/.modal

# Authenticate again
python -m modal setup
```

### Check Modal Status

To check if Modal is running and authenticated:

```bash
python -m modal status
```

### Verify Supabase Table Structure

```bash
npx supabase db diff
```

## Development Notes

- The Modal integration uses a Python server that must be running alongside the Next.js application
- Training a model typically takes 5-15 minutes depending on training steps and image count
- Progress is reported in 10% increments during training
- The trained model is stored in Modal's persistent volume storage 