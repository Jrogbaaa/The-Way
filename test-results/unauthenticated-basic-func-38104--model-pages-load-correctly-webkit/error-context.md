# Test info

- Name: Unauthenticated User Flow >> Individual model pages load correctly
- Location: /Users/JackEllis/THE WAY /e2e/unauthenticated/basic-functionality.spec.ts:50:7

# Error details

```
Error: page.goto: Navigation to "http://localhost:3000/models/cristina" is interrupted by another navigation to "http://localhost:3000/models/jaime"
Call log:
  - navigating to "http://localhost:3000/models/cristina", waiting until "load"

    at /Users/JackEllis/THE WAY /e2e/unauthenticated/basic-functionality.spec.ts:56:18
```

# Page snapshot

```yaml
- button "← Back to Models":
  - link "← Back to Models":
    - /url: /models
- heading "Jaime Model" [level=2]
- text: Custom Model
- img
- heading "Model Tips" [level=3]
- paragraph:
  - strong: Include "JAIME" (all caps)
  - text: in your prompt for best results.
- paragraph: "Best practices:"
- list:
  - listitem: Be specific about poses, expressions, lighting, and backgrounds
  - listitem: Simple scenes yield better results
  - listitem: "Try style descriptors: \"photorealistic,\" \"portrait photography,\" \"cinematic lighting\""
- paragraph: "Examples:"
- list:
  - listitem: JAIME in a suit, professional headshot
  - listitem: JAIME on a mountain, adventure photography
  - listitem: Close-up portrait of JAIME, studio lighting
  - listitem: JAIME with a dog, outdoor setting
  - listitem: JAIME playing basketball
- text: 0ms Jaime • 0% complete
- heading "Generate an Image" [level=3]
- text: Prompt
- img
- text: Try a suggestion
- button "JAIME with a suit and tie on h..."
- button "JAIME on a mountain hiking, ad..."
- button "JAIME in casual clothing at a ..."
- button "JAIME playing basketball, acti..."
- button "JAIME in a studio, professiona..."
- button "JAIME at the beach, sunset, go..."
- textbox "Prompt": JAIME
- text: Negative Prompt (Optional)
- textbox "Negative Prompt (Optional)"
- button "Generate Image":
  - img
  - text: Generate Image
- heading "About Jaime Model" [level=3]
- paragraph: Jaime is a custom model fine-tuned specifically for generating realistic images of Jaime in various contexts and styles.
- heading "Key Features:" [level=4]
- list:
  - listitem: Optimized for portraits and action photography
  - listitem: Custom-trained on high-quality reference images
  - listitem: Fine-tuned parameters for consistent results
  - listitem: Square output format (1:1 aspect ratio)
  - listitem: WebP format for optimal quality and file size
- heading "Best Used For:" [level=4]
- list:
  - listitem: Professional headshots and portraits
  - listitem: Adventure and outdoor scenes
  - listitem: Sports and action photography
  - listitem: Lifestyle and casual imagery
- paragraph: "Model ID: jrogbaaa/jaimecreator Version: 25698e8acc5a..."
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Unauthenticated User Flow', () => {
   4 |   test('Homepage loads and shows key features', async ({ page }) => {
   5 |     await page.goto('/');
   6 |     await page.waitForLoadState('networkidle');
   7 |     
   8 |     // Take screenshot for debugging
   9 |     await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
   10 |     
   11 |     // Check page title
   12 |     const title = await page.title();
   13 |     console.log('Homepage title:', title);
   14 |     
   15 |     // Check for main navigation
   16 |     await expect(page.locator('header').first()).toBeVisible();
   17 |     
   18 |     // Check for sign up/login buttons
   19 |     const signUpButton = page.locator('a[href*="signup"], button:has-text("Sign Up")');
   20 |     const signInButton = page.locator('a[href*="login"], button:has-text("Sign In")');
   21 |     
   22 |     await expect(signUpButton.or(signInButton).first()).toBeVisible();
   23 |   });
   24 |
   25 |   test('Models page is accessible without authentication', async ({ page }) => {
   26 |     await page.goto('/models');
   27 |     await page.waitForLoadState('networkidle');
   28 |     
   29 |     // Take screenshot
   30 |     await page.screenshot({ path: 'test-results/models-page.png', fullPage: true });
   31 |     
   32 |     // Check that we can access the models page (it should be public based on your middleware)
   33 |     const url = page.url();
   34 |     expect(url).toContain('/models');
   35 |     
   36 |     // Look for model cards or links
   37 |     const modelLinks = page.locator('a[href*="/models/"], [data-testid*="model"]');
   38 |     const modelCount = await modelLinks.count();
   39 |     console.log('Number of model links found:', modelCount);
   40 |     
   41 |     if (modelCount > 0) {
   42 |       // Check if we can see model names
   43 |       for (let i = 0; i < Math.min(modelCount, 3); i++) {
   44 |         const modelText = await modelLinks.nth(i).textContent();
   45 |         console.log(`Model ${i + 1}:`, modelText);
   46 |       }
   47 |     }
   48 |   });
   49 |
   50 |   test('Individual model pages load correctly', async ({ page }) => {
   51 |     const modelUrls = ['/models/jaime', '/models/cristina', '/models/bea'];
   52 |     
   53 |     for (const modelUrl of modelUrls) {
   54 |       console.log(`\n--- Testing ${modelUrl} ---`);
   55 |       
>  56 |       await page.goto(modelUrl);
      |                  ^ Error: page.goto: Navigation to "http://localhost:3000/models/cristina" is interrupted by another navigation to "http://localhost:3000/models/jaime"
   57 |       await page.waitForLoadState('networkidle');
   58 |       
   59 |       // Take screenshot
   60 |       const screenshotName = modelUrl.replace(/\//g, '-').substring(1);
   61 |       await page.screenshot({ path: `test-results/${screenshotName}.png`, fullPage: true });
   62 |       
   63 |       // Check if page loads (might redirect to login or show content)
   64 |       const currentUrl = page.url();
   65 |       console.log(`${modelUrl} - Current URL after navigation:`, currentUrl);
   66 |       
   67 |       // If redirected to login, that's expected behavior
   68 |       if (currentUrl.includes('/auth/login')) {
   69 |         console.log(`${modelUrl} - Redirected to login (expected for protected route)`);
   70 |         continue;
   71 |       }
   72 |       
   73 |       // If we can access the page, check its structure
   74 |       const h1Elements = await page.locator('h1').all();
   75 |       for (let i = 0; i < h1Elements.length; i++) {
   76 |         const text = await h1Elements[i].textContent();
   77 |         console.log(`${modelUrl} - H1 ${i + 1}:`, text);
   78 |       }
   79 |       
   80 |       // Check for form elements
   81 |       const promptInputs = page.locator('textarea[placeholder*="prompt"], input[placeholder*="prompt"]');
   82 |       const generateButtons = page.locator('button:has-text("Generate"), button[type="submit"]');
   83 |       
   84 |       const promptCount = await promptInputs.count();
   85 |       const buttonCount = await generateButtons.count();
   86 |       
   87 |       console.log(`${modelUrl} - Prompt inputs: ${promptCount}, Generate buttons: ${buttonCount}`);
   88 |       
   89 |       // If there are form elements, try interacting with them
   90 |       if (promptCount > 0) {
   91 |         const firstPromptInput = promptInputs.first();
   92 |         const isVisible = await firstPromptInput.isVisible();
   93 |         const isEnabled = await firstPromptInput.isEnabled();
   94 |         
   95 |         console.log(`${modelUrl} - First prompt input visible: ${isVisible}, enabled: ${isEnabled}`);
   96 |         
   97 |         if (isVisible && isEnabled) {
   98 |           // Try to fill the prompt
   99 |           await firstPromptInput.fill('Test prompt for automated testing');
  100 |           
  101 |           // Check if generate button becomes enabled
  102 |           if (buttonCount > 0) {
  103 |             const firstButton = generateButtons.first();
  104 |             const buttonEnabled = await firstButton.isEnabled();
  105 |             console.log(`${modelUrl} - Generate button enabled after filling prompt: ${buttonEnabled}`);
  106 |             
  107 |             // If button is enabled, we could try clicking it to see what happens
  108 |             // (but we won't actually generate images in this test)
  109 |           }
  110 |         }
  111 |       }
  112 |     }
  113 |   });
  114 |
  115 |   test('Social analyzer tool is accessible', async ({ page }) => {
  116 |     await page.goto('/social-analyzer');
  117 |     await page.waitForLoadState('networkidle');
  118 |     
  119 |     // Take screenshot
  120 |     await page.screenshot({ path: 'test-results/social-analyzer.png', fullPage: true });
  121 |     
  122 |     const currentUrl = page.url();
  123 |     console.log('Social analyzer URL:', currentUrl);
  124 |     
  125 |     // Check if we can access this tool without auth
  126 |     if (!currentUrl.includes('/auth/login')) {
  127 |       // Look for upload or input elements
  128 |       const fileInputs = page.locator('input[type="file"]');
  129 |       const textInputs = page.locator('textarea, input[type="text"]');
  130 |       
  131 |       const fileCount = await fileInputs.count();
  132 |       const textCount = await textInputs.count();
  133 |       
  134 |       console.log('Social analyzer - File inputs:', fileCount, 'Text inputs:', textCount);
  135 |     }
  136 |   });
  137 |
  138 |   test('Navigation between public pages works', async ({ page }) => {
  139 |     // Start at homepage
  140 |     await page.goto('/');
  141 |     await page.waitForLoadState('networkidle');
  142 |     
  143 |     // Try to navigate to models
  144 |     const modelsLink = page.locator('a[href="/models"], nav a:has-text("Models")');
  145 |     if (await modelsLink.isVisible()) {
  146 |       await modelsLink.click();
  147 |       await page.waitForLoadState('networkidle');
  148 |       
  149 |       const url = page.url();
  150 |       console.log('After clicking models link:', url);
  151 |       
  152 |       // Try to go back to home
  153 |       const homeLink = page.locator('a[href="/"], nav a:has-text("Home")');
  154 |       if (await homeLink.isVisible()) {
  155 |         await homeLink.click();
  156 |         await page.waitForLoadState('networkidle');
```