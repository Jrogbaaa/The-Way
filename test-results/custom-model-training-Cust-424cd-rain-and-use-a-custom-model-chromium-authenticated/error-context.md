# Test info

- Name: Custom Model Training and Usage Flow >> should allow user to create, train, and use a custom model
- Location: /Users/JackEllis/THE WAY /e2e/custom-model-training.spec.ts:29:7

# Error details

```
Error: Timed out 20000ms waiting for expect(locator).toBeVisible()

Locator: locator('h2:has-text("Create Model with Modal")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 20000ms
  - waiting for locator('h2:has-text("Create Model with Modal")')

    at /Users/JackEllis/THE WAY /e2e/custom-model-training.spec.ts:50:43
```

# Page snapshot

```yaml
- dialog "Welcome to Your Content AI Agent, Admin User!":
  - heading "Welcome to Your Content AI Agent, Admin User!" [level=2]
  - paragraph: "You're all set up! Here's what creators are doing on The Way:"
  - img
  - heading "Create Custom Model" [level=3]
  - paragraph: Create AI-generated images of yourself in various styles and scenarios.
  - button "Get Started":
    - link "Get Started":
      - /url: /models
      - text: Get Started
      - img
  - img
  - heading "Analyze Your Post" [level=3]
  - paragraph: Get insights and optimization tips to improve your social media content.
  - button "Analyze Content":
    - link "Analyze Content":
      - /url: /upload-post
      - text: Analyze Content
      - img
  - img
  - heading "Track Social Trends" [level=3]
  - paragraph: Monitor what's performing well and stay ahead of trending topics.
  - button "View Trends":
    - link "View Trends":
      - /url: /dashboard
      - text: View Trends
      - img
  - button "Skip for now & Go to Dashboard"
  - button "Close":
    - img
    - text: Close
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import path from 'path';
   3 | import fs from 'fs'; // Import fs for reading files
   4 |
   5 | // Extended timeout for the entire test suite, as model training can be lengthy
   6 | const EXTENDED_TIMEOUT = 20 * 60 * 1000; // 20 minutes, adjust as needed
   7 |
   8 | test.describe('Custom Model Training and Usage Flow', () => {
   9 |   test.slow(); // Marks all tests in this suite as slow
   10 |   test.setTimeout(EXTENDED_TIMEOUT);
   11 |
   12 |   const uniqueModelName = `TestModel-${Date.now()}`;
   13 |   const instancePrompt = `photo of sks ${uniqueModelName.toLowerCase()}`; // Ensure 'sks' is present
   14 |   const testImageFiles = [
   15 |     path.join(__dirname, 'test-assets', 'person-image-1.jpg'),
   16 |     path.join(__dirname, 'test-assets', 'person-image-2.jpg'),
   17 |     path.join(__dirname, 'test-assets', 'person-image-3.jpg'),
   18 |     path.join(__dirname, 'test-assets', 'person-image-4.jpg'),
   19 |     path.join(__dirname, 'test-assets', 'person-image-5.jpg'),
   20 |   ];
   21 |   // NOTE: Ensure you have 5 actual image files (e.g., .jpg, .png) in an 'e2e/test-assets/' directory
   22 |   // with names like person-image-1.jpg, person-image-2.jpg, etc.
   23 |
   24 |   test.beforeEach(async ({ page }) => {
   25 |     await page.goto('/models');
   26 |     await page.waitForLoadState('networkidle');
   27 |   });
   28 |
   29 |   test('should allow user to create, train, and use a custom model', async ({ page }) => {
   30 |     // 1. Initiate Model Creation
   31 |     const trainFirstModelButton = page.locator('button:has-text("Train Your First Model")');
   32 |     const createModelButton = page.locator('button:has-text("Create Model"), button:has-text("New Model"), a[href="/models/create"], button:has-text("Train New Model")').first();
   33 |     
   34 |     if (await trainFirstModelButton.isVisible()) {
   35 |       await trainFirstModelButton.click();
   36 |     } else if (await createModelButton.isVisible()) {
   37 |       await createModelButton.click();
   38 |       if (page.url().includes('/models/create')) {
   39 |         const useModalButton = page.locator('button:has-text("Use Modal Backend")');
   40 |         if (await useModalButton.isVisible()) {
   41 |           await useModalButton.click();
   42 |         }
   43 |       }
   44 |     } else {
   45 |       await page.goto('/models?create=true');
   46 |     }
   47 |
   48 |     // Wait for the main model creation modal to appear
   49 |     const modelCreationModalTitle = page.locator('h2:has-text("Create Model with Modal")');
>  50 |     await expect(modelCreationModalTitle).toBeVisible({ timeout: 20000 });
      |                                           ^ Error: Timed out 20000ms waiting for expect(locator).toBeVisible()
   51 |
   52 |     // AGGRESSIVELY HANDLE POTENTIAL WELCOME MODAL / OTHER OVERLAYS
   53 |     // Try a few common patterns for close buttons. 
   54 |     // If you know the specific text or aria-label of your welcome modal's close button, use that for more reliability.
   55 |     const closeButtonSelectors = [
   56 |       'div[role="dialog"] button[aria-label*="close" i]', // Common aria-label pattern
   57 |       'div[role="dialog"] button:has-text("Close")',     // Exact text "Close"
   58 |       'div[role="dialog"] button:has-text("Got it")',
   59 |       'div[role="dialog"] button:has-text("Skip")',
   60 |       'div[role="dialog"] button:has-text("Continue")',
   61 |       'div[role="dialog"] button:has-text("Alright")',
   62 |       'button[aria-label*="Dismiss" i]', // Another common aria-label
   63 |       'div[role="dialog"] button > svg[class*="close" i]' // SVG icon based close
   64 |     ];
   65 |
   66 |     for (const selector of closeButtonSelectors) {
   67 |       const closeButton = page.locator(selector).first();
   68 |       if (await closeButton.isVisible({ timeout: 500 })) { // Short timeout for each check
   69 |         console.log(`Attempting to close overlay with selector: ${selector}`);
   70 |         try {
   71 |           await closeButton.click({ timeout: 2000 });
   72 |           await page.waitForTimeout(700); // Brief pause for modal to animate out
   73 |           console.log('Overlay modal close button clicked.');
   74 |           // If one close button works, break from the loop assuming the overlay is handled
   75 |           if (!await modelCreationModalTitle.isVisible({timeout: 500})) {
   76 |             // If main modal title disappeared, the wrong modal might have been closed or main modal itself had this button.
   77 |             // This is a complex scenario. For now, we just log it.
   78 |             console.warn("Main modal title disappeared after clicking a close button. The test might become unstable.");
   79 |           } else {
   80 |             // Check if another overlay might still be present with a different close button
   81 |             let anotherOverlayFound = false;
   82 |             for (const innerSelector of closeButtonSelectors) {
   83 |                 if (await page.locator(innerSelector).first().isVisible({timeout: 200})) {
   84 |                     anotherOverlayFound = true;
   85 |                     console.log("Another overlay might still be present.");
   86 |                     break;
   87 |                 }
   88 |             }
   89 |             if (!anotherOverlayFound) break; // Exit if no other close buttons from our list are visible
   90 |           }
   91 |         } catch (e) {
   92 |           console.warn(`Could not click overlay close button with selector "${selector}", or it disappeared:`, (e as Error).message);
   93 |         }
   94 |       }
   95 |     }
   96 |     
   97 |     // As a final fallback if buttons weren't found or clicked successfully, try pressing Escape
   98 |     // but only if the main modal title is still potentially obscured or not primary.
   99 |     // This is tricky; ideally, one of the button clicks should handle it.
  100 |     // We can check if the main modal is still the active one or if something is on top.
  101 |     // For now, we rely on the loop above and ensure the main title is still present.
  102 |     
  103 |     // Ensure the main modal title is still there and interactable after attempting to close overlays
  104 |     await expect(modelCreationModalTitle).toBeVisible({ timeout: 5000 });
  105 |
  106 |     // 2. User Provides Input
  107 |     const modelNameInput = page.locator('input[id="modelName"]');
  108 |     await modelNameInput.waitFor({ state: 'visible', timeout: 10000 }); 
  109 |     await expect(modelNameInput).toBeEditable({ timeout: 5000 });
  110 |     await modelNameInput.click(); 
  111 |     await modelNameInput.fill(uniqueModelName);
  112 |     await page.waitForTimeout(500); // Small delay for stability, especially for Firefox
  113 |     await expect(modelNameInput).toHaveValue(uniqueModelName, { timeout: 10000 });
  114 |
  115 |     const instancePromptInput = page.locator('input[id="instancePrompt"]');
  116 |     await instancePromptInput.waitFor({ state: 'visible', timeout: 5000 });
  117 |     await expect(instancePromptInput).toBeEditable({ timeout: 5000 });
  118 |     await instancePromptInput.click(); 
  119 |     await instancePromptInput.fill(instancePrompt);
  120 |     await expect(instancePromptInput).toHaveValue(instancePrompt, { timeout: 10000 });
  121 |     
  122 |     // More robust selector for training speed, assuming it's a clickable div with a role and specific text.
  123 |     // This clicks the div itself that contains the "Balanced" text and icon.
  124 |     const balancedSpeedOption = page.locator('div.flex.flex-col.items-center.border.rounded-lg.p-4.cursor-pointer:has-text("Balanced")');
  125 |     await balancedSpeedOption.click();
  126 |     await expect(balancedSpeedOption).toHaveClass(/border-indigo-500/);
  127 |
  128 |
  129 |     // The actual input[type="file"] is hidden, so we check for the label's visibility
  130 |     const fileInputLabel = page.locator('label[for="image-upload"]');
  131 |     await expect(fileInputLabel).toBeVisible(); 
  132 |
  133 |     const fileInput = page.locator('input[type="file"]#image-upload');
  134 |     // No need to check fileInput.toBeVisible() as it's styled as hidden
  135 |     
  136 |     try {
  137 |       // Read files into buffers
  138 |       const imageFilesToUpload = testImageFiles.map(filePath => {
  139 |         const buffer = fs.readFileSync(filePath);
  140 |         return {
  141 |           name: path.basename(filePath),
  142 |           mimeType: filePath.endsWith('.png') ? 'image/png' : 'image/jpeg', // Adjust mimeType based on your files
  143 |           buffer: buffer
  144 |         };
  145 |       });
  146 |
  147 |       await fileInput.setInputFiles(imageFilesToUpload);
  148 |       console.log('Attempted to set input files using buffers. Backend will confirm processing.');
  149 |       // NOTE: The explicit check for "X images selected" text has been removed.
  150 |       // We now rely on the "Start Training" button becoming enabled as confirmation.
```