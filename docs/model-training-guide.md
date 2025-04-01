# Model Training Guide

This guide will help you train custom AI models using THE WAY's built-in LoRA training capabilities.

## What is LoRA Training?

LoRA (Low-Rank Adaptation) is a technique that allows you to fine-tune existing AI models with your own images to create custom models that can generate images in specific styles or of specific subjects. It's an efficient way to specialize large models without having to retrain them from scratch.

## Getting Started

### Preparing Your Training Data

Good training data is crucial for successful model training. Here's what you need to know:

1. **Number of images**: 15-20 high-quality images are recommended for best results
2. **Image quality**: Use clear, well-lit images with good resolution (at least 512×512 pixels)
3. **Variety**: Include a variety of poses, angles, and backgrounds
4. **Consistency**: The subject should be clearly visible and the main focus in each image
5. **Avoid**: Multiple subjects in the same image, blurry images, or heavily filtered photos

### Types of Models You Can Train

You can train different types of models for different purposes:

- **Person/Character Models**: Train on images of a specific person or character to generate new images of them
- **Style Models**: Train on images with a consistent artistic style to apply that style to new generations
- **Object Models**: Train on images of specific objects to generate variations or place them in new contexts

## Training Process

### Step 1: Access the Model Creation Page

1. Navigate to the Models section in the main navigation
2. Click "Create New Model" button

### Step 2: Fill in Basic Information

1. Give your model a descriptive name
2. Add a detailed description (optional but recommended)
3. Choose whether to make your model public or private

### Step 3: Upload Training Images

1. Drag and drop or click to select 15-20 high-quality images
2. Ensure images meet the quality guidelines mentioned above
3. Review the uploaded images and remove any that don't fit well

### Step 4: Configure Training Parameters

Choose the appropriate settings for your model:

- **Preset Difficulty Levels**:
  - **Beginner**: Fastest training (30-40 min), good for testing
  - **Standard**: Balanced quality and speed (40-60 min)
  - **Expert**: Highest quality results but slower (60-120 min)

- **Resolution**: Higher resolution produces more detailed results but takes longer to train
  - 512×512: Fast training, good for testing
  - 768×768: Balanced choice for most uses
  - 1024×1024: Higher quality, but slower training

- **Training Epochs**: More epochs means more training iterations, improving quality but increasing training time
  - 1 epoch: Quick results, good for testing
  - 2-3 epochs: Balanced approach
  - 4+ epochs: Better results but longer training time

- **Base Model**: The foundation model your LoRA will be trained on
  - SDXL: Latest model with highest quality (recommended)
  - Stable Diffusion 1.5: Faster but lower quality
  - Stable Diffusion 2.1: Good balance of quality and speed

### Step 5: Start Training

Click the "Start Training" button to begin the process. The training will take approximately 30-60 minutes depending on your settings.

### Step 6: Monitor Training Progress

You'll be redirected to a training status page where you can:
- See a real-time progress indicator
- View estimated remaining time
- Read helpful tips for each stage of training
- Check training details and status

You can close this page and return later - training will continue in the background.

### Step 7: Use Your Trained Model

Once training is complete:
1. Your model will appear in your Models dashboard
2. Select the model to start generating images
3. Use prompts that reference your subject or style
4. Experiment with different settings to get the best results

## Best Practices for Using Your Model

- **Prompts**: Include your model's name or subject in the prompt (e.g., "A photo of [subject] on a beach")
- **Negative Prompts**: Use negative prompts to avoid unwanted elements
- **LoRA Scale**: Adjust the LoRA scale (strength) to control how much influence your model has
- **Guidance Scale**: Lower values (5-7) for more creative results, higher values (7-10) for more accurate results
- **Save Successful Prompts**: Keep track of prompts that work well with your model

## Troubleshooting

If your model isn't producing the results you expected:

- **Training Quality**: Consider retraining with more or better quality images
- **Prompt Engineering**: Experiment with different prompts and LoRA strength values
- **Base Model**: Try a different base model that might work better with your subject
- **Training Parameters**: Increase training epochs or resolution for better results

## Technical Details

Our model training uses Replicate's Flux LoRA trainer, which is an implementation of the LoRA fine-tuning technique optimized for efficient training on consumer-grade hardware. The process runs in the cloud, so you don't need any special hardware to train models.

For more information on the technical details, visit [Replicate's Flux LoRA Trainer documentation](https://replicate.com/ostris/flux-dev-lora-trainer/train). 