# Photo Editor Documentation (Bria AI Integration)

## Overview

The Photo Editor feature is being rebuilt to leverage Bria AI's comprehensive image editing API ([https://docs.bria.ai/](https://docs.bria.ai/)). This allows for advanced, AI-powered manipulation of images directly within the application.

## Current Status (Rebuild in Progress)

We are currently integrating Bria AI features step-by-step. The goal is to provide a robust editor utilizing Bria's capabilities.

## Implemented Features

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

## Features To Be Implemented

Based on Bria AI documentation:

*   Background Removal (`/background/remove`)
*   Eraser (`/eraser`)
*   Crop (`/crop`)
*   Background Blur (`/background/blur`)
*   Background Replace (`/background/replace`)
*   Erase Foreground (`/erase_foreground`)
*   Caption (`/caption`)
*   GenFill (`/gen_fill`) - *Marked as "coming soon" in Bria docs*

## Technical Details

*   **Frontend:** Built with React, Next.js, TypeScript, Tailwind CSS, and Shadcn UI components.
*   **Backend API Routes:** Located under `src/app/api/bria/`. Each route handles communication with a specific Bria AI endpoint.
    *   Uses `axios` for making requests to the Bria API.
    *   Handles `multipart/form-data` for image uploads.
    *   Manages authentication using the `api-token` header.
*   **Environment Variables:** Requires `BRIA_AI_API_KEY` and `BRIA_AI_BASE_URL` to be set in `.env.local`.

## Troubleshooting

*   **401 Unauthorized:** Verify the `BRIA_AI_API_KEY` value in `.env.local` is correct and active. Ensure the `api-token` header is being sent correctly by the API routes. Confirm the `BRIA_AI_BASE_URL` is correct (`https://engine.prod.bria-api.com/v1`).
*   **ENOTFOUND Error:** Check the `BRIA_AI_BASE_URL` in `.env.local` and ensure network connectivity/DNS resolution is working.
*   **Other API Errors:** Check the browser console and server logs for detailed error messages from the Bria API. 