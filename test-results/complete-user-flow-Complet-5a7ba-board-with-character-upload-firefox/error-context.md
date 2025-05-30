# Test info

- Name: Complete User Flow - Image Generation with Flux LoRA Models >> User can create storyboard with character upload
- Location: /Users/JackEllis/THE WAY /e2e/complete-user-flow.spec.ts:110:7

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea[placeholder*="description"]')

    at /Users/JackEllis/THE WAY /e2e/complete-user-flow.spec.ts:139:16
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
   39 |     await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
   40 |     
   41 |     // Verify image was generated
   42 |     await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
   43 |     
   44 |     // Test image modal functionality
   45 |     await page.click('img[alt*="Generated image"]');
   46 |     await expect(page.locator('[role="dialog"]')).toBeVisible();
   47 |     
   48 |     // Close modal
   49 |     await page.keyboard.press('Escape');
   50 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible();
   51 |   });
   52 |
   53 |   test('User can generate images with Cristina model', async ({ page }) => {
   54 |     // Navigate directly to Cristina model
   55 |     await page.goto('/models/cristina');
   56 |     
   57 |     // Verify Cristina model page loads
   58 |     await expect(page.locator('h1')).toContainText('Cristina');
   59 |     
   60 |     // Test suggested prompt functionality
   61 |     await page.click('text=CRISTINA wearing a dress walking on the beach');
   62 |     
   63 |     // Verify prompt was filled
   64 |     const promptValue = await page.inputValue('textarea[placeholder*="prompt"]');
   65 |     expect(promptValue).toContain('CRISTINA wearing a dress walking on the beach');
   66 |     
   67 |     // Add negative prompt
   68 |     await page.fill('textarea[placeholder*="negative"]', 'blurry, low quality, distorted');
   69 |     
   70 |     // Generate image
   71 |     await page.click('button:has-text("Generate Image")');
   72 |     
   73 |     // Wait for generation progress
   74 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
   75 |     
   76 |     // Wait for completion
   77 |     await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
   78 |     
   79 |     // Verify image generation
   80 |     await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
   81 |   });
   82 |
   83 |   test('User can generate images with Bea model', async ({ page }) => {
   84 |     // Navigate to Bea model
   85 |     await page.goto('/models/bea');
   86 |     
   87 |     // Verify page loads
   88 |     await expect(page.locator('h1')).toContainText('Bea');
   89 |     
   90 |     // Fill prompt
   91 |     await page.fill('input[placeholder*="prompt"]', 'BEA in a professional setting, corporate headshot');
   92 |     
   93 |     // Set number of outputs
   94 |     await page.selectOption('select', '2');
   95 |     
   96 |     // Generate images
   97 |     await page.click('button:has-text("Generate")');
   98 |     
   99 |     // Wait for loading
  100 |     await expect(page.locator('text=Generating amazing images')).toBeVisible({ timeout: 5000 });
  101 |     
  102 |     // Wait for completion
  103 |     await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
  104 |     
  105 |     // Verify multiple images were generated
  106 |     const images = page.locator('img[alt*="Generated image"]');
  107 |     await expect(images).toHaveCount(2);
  108 |   });
  109 |
  110 |   test('User can create storyboard with character upload', async ({ page }) => {
  111 |     // Navigate to storyboard creation
  112 |     await page.goto('/storyboard-creator');
  113 |     
  114 |     // Verify storyboard page loads
  115 |     await expect(page.locator('h1')).toContainText('Create Video');
  116 |     
  117 |     // Upload main character image
  118 |     const fileInput = page.locator('input[type="file"]').first();
  119 |     
  120 |     // Create a test image file
  121 |     const testImagePath = path.join(__dirname, 'test-assets', 'test-character.jpg');
  122 |     
  123 |     // If test image doesn't exist, create a simple one or skip this part
  124 |     try {
  125 |       await fileInput.setInputFiles(testImagePath);
  126 |       
  127 |       // Verify image was uploaded
  128 |       await expect(page.locator('text=Great! Your main character is ready')).toBeVisible();
  129 |       
  130 |       // Verify character image is displayed
  131 |       await expect(page.locator('img[alt="Main character"]')).toBeVisible();
  132 |       
  133 |     } catch (error) {
  134 |       console.log('Test image not found, skipping file upload test');
  135 |     }
  136 |     
  137 |     // Test storyboard title and description
  138 |     await page.fill('input[placeholder*="title"]', 'My Test Storyboard');
> 139 |     await page.fill('textarea[placeholder*="description"]', 'A test storyboard for Playwright testing');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  140 |     
  141 |     // Add a scene description
  142 |     await page.fill('textarea[placeholder*="scene description"]', 'Character walking in a park');
  143 |     
  144 |     // Select setting
  145 |     await page.fill('input[placeholder*="setting"]', 'Beautiful park with trees');
  146 |     
  147 |     // Test scene navigation - click "Add New Scene" or "Next Scene"
  148 |     const nextSceneButton = page.locator('button:has-text("Add New Scene"), button:has-text("Next Scene")');
  149 |     if (await nextSceneButton.isVisible()) {
  150 |       await nextSceneButton.click();
  151 |       
  152 |       // Verify we moved to next scene
  153 |       await expect(page.locator('text=Scene 2')).toBeVisible();
  154 |     }
  155 |   });
  156 |
  157 |   test('User can test SDXL model for general image generation', async ({ page }) => {
  158 |     // Navigate to SDXL model
  159 |     await page.goto('/models/sdxl');
  160 |     
  161 |     // Verify page loads
  162 |     await expect(page.locator('h1')).toContainText('SDXL');
  163 |     
  164 |     // Test suggested prompt
  165 |     await page.click('text=A majestic lion in the African savanna');
  166 |     
  167 |     // Verify prompt was filled
  168 |     const promptValue = await page.inputValue('textarea[placeholder*="prompt"]');
  169 |     expect(promptValue).toContain('A majestic lion in the African savanna');
  170 |     
  171 |     // Generate image
  172 |     await page.click('button:has-text("Generate Image")');
  173 |     
  174 |     // Wait for generation
  175 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
  176 |     
  177 |     // Wait for completion
  178 |     await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
  179 |     
  180 |     // Verify image was generated
  181 |     await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
  182 |     
  183 |     // Test download functionality
  184 |     await page.click('button[aria-label*="Download"]');
  185 |     
  186 |     // Note: Actual download testing would require additional setup
  187 |     // This just verifies the download button is clickable
  188 |   });
  189 |
  190 |   test('User flow: Browse models → Select model → Generate → View results', async ({ page }) => {
  191 |     // Start from models gallery
  192 |     await page.goto('/models');
  193 |     
  194 |     // Verify all available models are displayed
  195 |     await expect(page.locator('text=Jaime Creator')).toBeVisible();
  196 |     await expect(page.locator('text=Cristina')).toBeVisible();
  197 |     await expect(page.locator('text=Bea')).toBeVisible();
  198 |     await expect(page.locator('text=SDXL')).toBeVisible();
  199 |     
  200 |     // Click on a model card
  201 |     await page.click('text=Jaime Creator');
  202 |     
  203 |     // Verify navigation to model page
  204 |     await page.waitForURL('**/models/jaime');
  205 |     
  206 |     // Quick generation test
  207 |     await page.fill('textarea[placeholder*="prompt"]', 'JAIME casual portrait');
  208 |     await page.click('button:has-text("Generate Image")');
  209 |     
  210 |     // Verify generation starts
  211 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
  212 |     
  213 |     // Go back to models gallery
  214 |     await page.click('text=← Back to Models');
  215 |     await page.waitForURL('**/models');
  216 |     
  217 |     // Verify we're back at the gallery
  218 |     await expect(page.locator('h1')).toContainText('AI Models');
  219 |   });
  220 |
  221 |   test('Error handling: Invalid prompts and network issues', async ({ page }) => {
  222 |     // Navigate to a model page
  223 |     await page.goto('/models/jaime');
  224 |     
  225 |     // Test empty prompt
  226 |     await page.click('button:has-text("Generate Image")');
  227 |     
  228 |     // Should show some validation or remain disabled
  229 |     const generateButton = page.locator('button:has-text("Generate Image")');
  230 |     await expect(generateButton).toBeDisabled();
  231 |     
  232 |     // Test with valid prompt
  233 |     await page.fill('textarea[placeholder*="prompt"]', 'JAIME test prompt');
  234 |     await expect(generateButton).toBeEnabled();
  235 |     
  236 |     // Test network error simulation (if needed)
  237 |     // This would require intercepting network requests
  238 |   });
  239 |
```