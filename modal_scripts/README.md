# Modal Scripts

This directory contains Python scripts for running GPU-accelerated model training with [Modal](https://modal.com/).

## Files

- `train_model.py` - The main script used for training custom image generation models with Stable Diffusion and LoRA

## Setup

Before running these scripts, follow the setup instructions in `/docs/MODAL_INTEGRATION.md`.

## Usage

### Starting the Modal Server

```bash
# Activate your Python environment
source modal-env/bin/activate

# Start the Modal server
python -m modal serve train_model.py
```

### Manual Testing

You can test the Modal functions directly:

```bash
# Test preprocessing
python -m modal run train_model.py --input test_data.json
```

Where `test_data.json` contains:

```json
{
  "imageDataList": [
    {
      "base64Data": "BASE64_ENCODED_IMAGE_DATA",
      "name": "test.jpg",
      "type": "image/jpeg"
    }
  ],
  "instancePrompt": "photo of sks person",
  "modelName": "test-model",
  "trainingSteps": 500
}
```

## Integration with Next.js

These Modal scripts are called from the Next.js API routes:

- `/api/model/create` - Calls the `train_model.py` script to start training
- `/api/modal/model-status/[modelId]` - Checks the status of a training job
- `/api/modal/training-progress` - Receives progress updates during training

## Required Dependencies

- Python 3.10+
- Modal
- PyTorch
- Diffusers
- Transformers
- Accelerate
- BitsAndBytes
- PEFT (Parameter-Efficient Fine-Tuning)

All dependencies are specified in the Modal image definition in `train_model.py`. 