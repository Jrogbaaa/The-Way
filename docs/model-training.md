# Custom Model Training

This document explains how to train your own custom image generation model using THE WAY's simplified training process.

## Overview

THE WAY allows you to create custom AI models trained on your own images. Once trained, these models can generate new images in the style or featuring the subject of your training data.

## Requirements

To train a custom model, you'll need:

1. **10-30 high-quality images** of your subject or in your desired style
2. **A name** for your model
3. **A keyword/trigger word** that will activate your model in prompts

## Training Process

The training process has been simplified to make it as easy as possible:

1. Navigate to the **Create Model** page
2. Enter a **name** for your model (e.g., "My Portrait Model")
3. Enter a **keyword/trigger word** (e.g., "myportrait") that will be used in prompts
4. Upload a **ZIP file** containing your training images
5. Click **Create Model** to start the training process

That's it! Behind the scenes, we use optimized settings to ensure the best quality results:
- LoRA Rank: 32 (for enhanced detail capture)
- Training steps: 1500 (balanced for quality and speed)
- Resolution: 1024px (high-quality output)
- Other technical parameters are pre-configured for optimal results

## Training Time

Training typically takes 20-40 minutes depending on the number of images. You'll receive a notification when your model is ready to use.

## Using Your Trained Model

Once training is complete:

1. Go to the **Models** page
2. Find your newly trained model in the list
3. Use the model to generate images by including your keyword in the prompt

Example prompt: "A photo of **myportrait** standing on a beach at sunset, professional photography"

## Tips for Best Results

- Use 10-30 clear, high-quality images of your subject
- Include variety in poses, expressions, and backgrounds if training a portrait model
- For style models, choose images with consistent artistic elements
- Make sure your images are properly cropped to focus on the subject
- Choose a unique keyword that isn't commonly used in prompts

## Troubleshooting

If you encounter issues during training:

- Make sure your ZIP file contains valid images (JPG, PNG, or WebP format)
- Check that your images meet the recommended guidelines
- Ensure your API token has sufficient credits/permissions
- If training fails, try again with fewer or different images

For additional support, please contact our team. 