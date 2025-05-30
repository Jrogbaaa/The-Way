import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs'; // Import fs for reading files

// Extended timeout for the entire test suite, as model training can be lengthy
const EXTENDED_TIMEOUT = 20 * 60 * 1000; // 20 minutes, adjust as needed

test.describe('Custom Model Training and Usage Flow', () => {
  test.slow(); // Marks all tests in this suite as slow
  test.setTimeout(EXTENDED_TIMEOUT);

  const uniqueModelName = `TestModel-${Date.now()}`;
  const instancePrompt = `photo of sks ${uniqueModelName.toLowerCase()}`; // Ensure 'sks' is present
  const testImageFiles = [
    path.join(__dirname, 'test-assets', 'person-image-1.jpg'),
    path.join(__dirname, 'test-assets', 'person-image-2.jpg'),
    path.join(__dirname, 'test-assets', 'person-image-3.jpg'),
    path.join(__dirname, 'test-assets', 'person-image-4.jpg'),
    path.join(__dirname, 'test-assets', 'person-image-5.jpg'),
  ];
  // NOTE: Ensure you have 5 actual image files (e.g., .jpg, .png) in an 'e2e/test-assets/' directory
  // with names like person-image-1.jpg, person-image-2.jpg, etc.

  test.beforeEach(async ({ page }) => {
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
  });

  test('should allow user to create, train, and use a custom model', async ({ page }) => {
    // 1. Initiate Model Creation
    const trainFirstModelButton = page.locator('button:has-text("Train Your First Model")');
    const createModelButton = page.locator('button:has-text("Create Model"), button:has-text("New Model"), a[href="/models/create"], button:has-text("Train New Model")').first();
    
    if (await trainFirstModelButton.isVisible()) {
      await trainFirstModelButton.click();
    } else if (await createModelButton.isVisible()) {
      await createModelButton.click();
      if (page.url().includes('/models/create')) {
        const useModalButton = page.locator('button:has-text("Use Modal Backend")');
        if (await useModalButton.isVisible()) {
          await useModalButton.click();
        }
      }
    } else {
      await page.goto('/models?create=true');
    }

    // Wait for the main model creation modal to appear
    const modelCreationModalTitle = page.locator('h2:has-text("Create Model with Modal")');
    await expect(modelCreationModalTitle).toBeVisible({ timeout: 20000 });

    // AGGRESSIVELY HANDLE POTENTIAL WELCOME MODAL / OTHER OVERLAYS
    // Try a few common patterns for close buttons. 
    // If you know the specific text or aria-label of your welcome modal's close button, use that for more reliability.
    const closeButtonSelectors = [
      'div[role="dialog"] button[aria-label*="close" i]', // Common aria-label pattern
      'div[role="dialog"] button:has-text("Close")',     // Exact text "Close"
      'div[role="dialog"] button:has-text("Got it")',
      'div[role="dialog"] button:has-text("Skip")',
      'div[role="dialog"] button:has-text("Continue")',
      'div[role="dialog"] button:has-text("Alright")',
      'button[aria-label*="Dismiss" i]', // Another common aria-label
      'div[role="dialog"] button > svg[class*="close" i]' // SVG icon based close
    ];

    for (const selector of closeButtonSelectors) {
      const closeButton = page.locator(selector).first();
      if (await closeButton.isVisible({ timeout: 500 })) { // Short timeout for each check
        console.log(`Attempting to close overlay with selector: ${selector}`);
        try {
          await closeButton.click({ timeout: 2000 });
          await page.waitForTimeout(700); // Brief pause for modal to animate out
          console.log('Overlay modal close button clicked.');
          // If one close button works, break from the loop assuming the overlay is handled
          if (!await modelCreationModalTitle.isVisible({timeout: 500})) {
            // If main modal title disappeared, the wrong modal might have been closed or main modal itself had this button.
            // This is a complex scenario. For now, we just log it.
            console.warn("Main modal title disappeared after clicking a close button. The test might become unstable.");
          } else {
            // Check if another overlay might still be present with a different close button
            let anotherOverlayFound = false;
            for (const innerSelector of closeButtonSelectors) {
                if (await page.locator(innerSelector).first().isVisible({timeout: 200})) {
                    anotherOverlayFound = true;
                    console.log("Another overlay might still be present.");
                    break;
                }
            }
            if (!anotherOverlayFound) break; // Exit if no other close buttons from our list are visible
          }
        } catch (e) {
          console.warn(`Could not click overlay close button with selector "${selector}", or it disappeared:`, (e as Error).message);
        }
      }
    }
    
    // As a final fallback if buttons weren't found or clicked successfully, try pressing Escape
    // but only if the main modal title is still potentially obscured or not primary.
    // This is tricky; ideally, one of the button clicks should handle it.
    // We can check if the main modal is still the active one or if something is on top.
    // For now, we rely on the loop above and ensure the main title is still present.
    
    // Ensure the main modal title is still there and interactable after attempting to close overlays
    await expect(modelCreationModalTitle).toBeVisible({ timeout: 5000 });

    // 2. User Provides Input
    const modelNameInput = page.locator('input[id="modelName"]');
    await modelNameInput.waitFor({ state: 'visible', timeout: 10000 }); 
    await expect(modelNameInput).toBeEditable({ timeout: 5000 });
    await modelNameInput.click(); 
    await modelNameInput.fill(uniqueModelName);
    await page.waitForTimeout(500); // Small delay for stability, especially for Firefox
    await expect(modelNameInput).toHaveValue(uniqueModelName, { timeout: 10000 });

    const instancePromptInput = page.locator('input[id="instancePrompt"]');
    await instancePromptInput.waitFor({ state: 'visible', timeout: 5000 });
    await expect(instancePromptInput).toBeEditable({ timeout: 5000 });
    await instancePromptInput.click(); 
    await instancePromptInput.fill(instancePrompt);
    await expect(instancePromptInput).toHaveValue(instancePrompt, { timeout: 10000 });
    
    // More robust selector for training speed, assuming it's a clickable div with a role and specific text.
    // This clicks the div itself that contains the "Balanced" text and icon.
    const balancedSpeedOption = page.locator('div.flex.flex-col.items-center.border.rounded-lg.p-4.cursor-pointer:has-text("Balanced")');
    await balancedSpeedOption.click();
    await expect(balancedSpeedOption).toHaveClass(/border-indigo-500/);


    // The actual input[type="file"] is hidden, so we check for the label's visibility
    const fileInputLabel = page.locator('label[for="image-upload"]');
    await expect(fileInputLabel).toBeVisible(); 

    const fileInput = page.locator('input[type="file"]#image-upload');
    // No need to check fileInput.toBeVisible() as it's styled as hidden
    
    try {
      // Read files into buffers
      const imageFilesToUpload = testImageFiles.map(filePath => {
        const buffer = fs.readFileSync(filePath);
        return {
          name: path.basename(filePath),
          mimeType: filePath.endsWith('.png') ? 'image/png' : 'image/jpeg', // Adjust mimeType based on your files
          buffer: buffer
        };
      });

      await fileInput.setInputFiles(imageFilesToUpload);
      console.log('Attempted to set input files using buffers. Backend will confirm processing.');
      // NOTE: The explicit check for "X images selected" text has been removed.
      // We now rely on the "Start Training" button becoming enabled as confirmation.

    } catch (e) {
      // Correctly formatted console.warn and re-throw the error to fail the test if upload truly fails.
      const errorMessage = `Could not upload test images: ${(e as Error).message}. Ensure test image files exist at the specified paths and the file input is correctly targeted.`;
      console.warn(errorMessage);
      throw new Error(`Test image upload failed: ${errorMessage}. Cannot proceed with model training test.`);
    }
    
    const startTrainingButton = page.locator('button:has-text("Start Training")');
    await expect(startTrainingButton).toBeEnabled({ timeout: 10000 }); // Give some time for button to enable after uploads
    await startTrainingButton.click();

    // 3. Model Training Occurs (Asynchronous)
    // ... existing code ...
  });
});