# Photo Editor Troubleshooting Guide

This document provides solutions for common issues with the PhotoEditor component.

## Common Issues and Solutions

### 1. UI Stuck in "Processing" State

**Symptoms:**
- Loading spinner keeps showing even after the API returns a successful result
- Console shows successful API responses, but UI doesn't update
- "Processing your image..." message remains visible

**Solution:**
- Ensure that both `isPolling` and `isProcessing` states are reset to `false` after processing completes
- Check that the Result section in the UI properly considers all loading states
- In `handleEditAction`, make sure to set `setIsProcessing(false)` in all success paths

```jsx
// For Replicate inpainting
if (predictionResult) {
  setEditedImage(predictionResult);
  setProcessingMessage(null);
  setIsProcessing(false); // Important: Reset processing state
} else {
  throw new Error("Failed to get result from Replicate");
}
```

### 2. Canvas Drawing Issues

**Symptoms:**
- Unable to draw on the canvas
- "Context is NULL!" errors in console
- Drawing doesn't appear on the canvas

**Solution:**
- Ensure canvas context is initialized properly and only when the canvas is actually rendered
- Use a `useEffect` hook to set up the canvas context when both canvas is rendered and image is loaded
- Separate context initialization from image loading logic

```jsx
// Effect to setup canvas context when canvas is rendered and image is loaded
useEffect(() => {
  const needsCanvas = editingMode === EDITING_MODES.INPAINT || 
                      editingMode === EDITING_MODES.GENFILL || 
                      editingMode === EDITING_MODES.COMFY_INPAINT;
  
  // Only proceed if we need the canvas, the ref is set, and we have image dimensions
  if (needsCanvas && canvasRef.current && imageDimensions) {
    // Set up canvas context here...
  }
}, [editingMode, canvasRef.current, imageDimensions]);
```

### 3. API Route Parameter Errors

**Symptoms:**
- Error messages like "Route '/api/replicate/predictions/[id]' used `params.id`. `params` should be awaited before using its properties."
- API calls fail with 500 errors
- Console shows NextJS API route parameter errors

**Solution:**
- In Next.js 13+ API routes, don't use optional chaining with params
- Access params directly without awaiting them
- Proper pattern for dynamic route parameters:

```jsx
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get prediction ID from params directly
  const predictionId = params.id;
  
  // Rest of the function...
}
```

### 4. ComfyUI Integration Issues

**Symptoms:**
- "ComfyUI inpainting failed" errors
- "Failed to connect to ComfyUI" messages
- No response from ComfyUI server

**Solution:**
- Ensure ComfyUI is installed and running on http://127.0.0.1:8188
- Verify that required models are installed in the ComfyUI models directory
- Check that the communication between the app and ComfyUI is working properly:

```bash
# Test ComfyUI connection
curl http://127.0.0.1:8188
```

## Development Tips

### State Management Best Practices

1. **Process States**: Always have clear entry and exit points for all process states like `isProcessing`, `isPolling`, etc.
2. **Error Handling**: Make sure `catch` blocks reset all processing states and display meaningful error messages
3. **Loading Indicators**: Check all relevant loading states in UI conditions
4. **Cleanup**: Always clean up resources in `finally` blocks and effect cleanup functions

### Canvas Operations

1. Ensure canvas dimensions match the displayed image size
2. Initialize context only when both canvas and image are available
3. Use separate effects for context setup and brush settings
4. Properly clean up canvas resources when component unmounts

## Support

If you encounter issues not covered in this guide, please contact the development team or file a GitHub issue with:

1. Steps to reproduce the issue
2. Console logs and errors
3. Browser and device information
4. Screenshots or video of the issue 