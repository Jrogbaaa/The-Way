# Photo Editor Documentation

## Overview

The Photo Editor feature leverages multiple AI services for advanced image editing capabilities directly within the application.

*   **Bria AI Integration:** Used for features like upscaling and image expansion. ([https://docs.bria.ai/](https://docs.bria.ai/))
*   **Replicate Integration:** Used for features like generative fill/inpainting.

## Current Status (Features Implemented)

### Bria AI Features

1.  **Image Upload & Preview:**
    *   Users can upload images (JPEG, PNG, WebP) up to 10MB.
    *   A preview of the uploaded image is displayed.
    *   Basic validation for file type and size is included.
    *   Side-by-side view for Original vs. Result.

2.  **Increase Resolution (Upscale):**
    *   Uses Bria AI's `/increase_resolution` endpoint.
    *   Accessible via the "Upscale" tab.
    *   Sends the uploaded image to the Bria API via `/api/bria/increase-resolution`.
    *   Displays the upscaled result.

3.  **Image Expansion (Outpaint):**
    *   Uses Bria AI's `/image_expansion` endpoint.
    *   Accessible via the "Expand" tab.
    *   Allows users to select one or more directions (top, bottom, left, right).
    *   Includes an optional text prompt to guide the expansion content.
    *   Sends the image, direction(s), and prompt to Bria via `/api/bria/image-expansion`.
    *   Displays the expanded result.

### Replicate-Powered Features

1.  **Generative Fill / Inpainting:**
    *   Uses the `stability-ai/stable-diffusion-inpainting` model hosted on Replicate.
    *   Accessible via the "Generative Fill" tab/button.
    *   **Workflow:**
        1.  Upload an image.
        2.  Select the "Generative Fill" editing mode.
        3.  Draw a mask over the area you want to replace or modify on the image canvas.
        4.  Enter a descriptive text prompt detailing what you want to generate in the masked area (e.g., "a realistic green bush growing on the rocks").
        5.  Click the "Generate Fill" or equivalent button.
        6.  The request (image, mask, prompt) is sent to the backend via `/api/replicate/inpaint`.
        7.  The backend initiates a prediction job on Replicate.
        8.  The frontend polls the prediction status via `/api/replicate/predictions/[id]`.
        9.  The resulting generated image is displayed in the "Result" panel.
    *   **Tips for Better Results:**
        *   Use smaller, more focused masks rather than very large ones.
        *   Write specific, descriptive prompts.
        *   Experiment with different prompts if the initial result isn't satisfactory.

## Features To Be Implemented

Based on Bria AI documentation:

*   Background Removal (`/background/remove`)
*   Eraser (`/eraser`)
*   Crop (`/crop`)
*   Background Blur (`/background/blur`)
*   Background Replace (`/background/replace`)
*   Erase Foreground (`/erase_foreground`)
*   Caption (`/caption`)
*   GenFill (`/gen_fill`) - *Marked as "coming soon" in Bria docs, potentially redundant with Replicate feature*

## Technical Details

*   **Frontend:** Built with React, Next.js, TypeScript, Tailwind CSS, and Shadcn UI components.
*   **Bria AI Backend:**
    *   API Routes: Located under `src/app/api/bria/`.
    *   Authentication: `api-token` header using `BRIA_AI_API_KEY`.
    *   Environment Variables: `BRIA_AI_API_KEY`, `BRIA_AI_BASE_URL`.
*   **Replicate Backend:**
    *   API Routes: `src/app/api/replicate/inpaint/route.ts`, `src/app/api/replicate/predictions/[id]/route.ts`.
    *   Model Used: `stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3` (or latest working version).
    *   Authentication: Replicate client initialized with `REPLICATE_API_TOKEN`.
    *   Environment Variables: `REPLICATE_API_TOKEN`.

## Troubleshooting

*   **Bria AI 401 Unauthorized:** Verify `BRIA_AI_API_KEY` and `BRIA_AI_BASE_URL` (`https://engine.prod.bria-api.com/v1`).
*   **Bria AI ENOTFOUND:** Check `BRIA_AI_BASE_URL` and network/DNS.
*   **Replicate 422 Unprocessable Entity / Permission Denied:** Verify the `REPLICATE_API_TOKEN` is correct, active, and has permissions for the specific model version (`stability-ai/stable-diffusion-inpainting:VERSION_HASH`) on your Replicate dashboard. Check that input parameters (prompt, mask, image, steps, guidance) sent by `/api/replicate/inpaint` are valid for the model version.
*   **Replicate 404 Not Found (Model):** Ensure the model name and version hash in `/api/replicate/inpaint/route.ts` are correct and publicly available or accessible by your token.
*   **Inpainting Result Doesn't Match Prompt:** Experiment with mask size/placement, prompt specificity, and negative prompts. Parameter tuning (`guidance_scale`, `num_inference_steps`, `scheduler`) in `/api/replicate/inpaint/route.ts` might be required for better creative control.
*   **Other API Errors:** Check the browser console and server (terminal) logs for detailed error messages from the respective AI service. 