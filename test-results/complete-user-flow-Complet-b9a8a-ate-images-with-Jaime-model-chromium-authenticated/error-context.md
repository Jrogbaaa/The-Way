# Test info

- Name: Complete User Flow - Image Generation with Flux LoRA Models >> User can navigate to models and generate images with Jaime model
- Location: /Users/JackEllis/THE WAY /e2e/complete-user-flow.spec.ts:13:7

# Error details

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Models')

    at /Users/JackEllis/THE WAY /e2e/complete-user-flow.spec.ts:15:16
```

# Page snapshot

```yaml
- banner:
  - link "Go to home page":
    - /url: /
    - img
    - text: optimalpost.ai
  - navigation
- main:
  - heading "We know what's best for your social media. We're gonna show you how it's done." [level=1]
  - paragraph: Our AI-powered platform guides you through content creation, targeting, and distribution in one seamless flow.
  - button "Try our tools":
    - text: Create Posts
    - img
  - paragraph: No login required • Try instantly
  - img
  - text: AI-driven targeting
  - img
  - text: Integrated analytics
  - img
  - text: Content calendar
  - img
  - img
  - text: AI-Generated
  - paragraph: Trusted by content creators worldwide
  - heading "The complete content creation workflow" [level=2]
  - paragraph: Our streamlined process takes you from idea to publishable content in minutes
  - img
  - heading "1. AI-Powered Ideas" [level=3]
  - paragraph: Tell us your goal and audience, and our AI generates tailored content ideas
  - button "Try Now"
  - img
  - heading "2. Create & Refine" [level=3]
  - paragraph: Instantly transform ideas into visuals, captions, and engaging content
  - button "Try Now"
  - img
  - heading "3. Target & Optimize" [level=3]
  - paragraph: Get AI-suggested @mentions and optimize content for maximum engagement
  - button "Try Now"
  - heading "Ready to transform your social media content?" [level=2]
  - paragraph: Join thousands of creators who are saving time and getting better results
  - button "Try our tools without login": Try Without Login
  - link "Sign up for a free trial":
    - /url: /auth/signup
    - text: Start Free Trial
  - paragraph: Experience the value first • No login required
- contentinfo:
  - img
  - text: Content AI Agent
  - paragraph: Empowering content creators with AI-powered tools for better social media content.
  - heading "Product" [level=3]
  - list:
    - listitem:
      - link "Features":
        - /url: "#"
    - listitem:
      - link "Pricing":
        - /url: "#"
    - listitem:
      - link "Documentation":
        - /url: "#"
    - listitem:
      - link "Roadmap":
        - /url: "#"
  - heading "Company" [level=3]
  - list:
    - listitem:
      - link "About":
        - /url: "#"
    - listitem:
      - link "Blog":
        - /url: "#"
    - listitem:
      - link "Careers":
        - /url: "#"
    - listitem:
      - link "Contact":
        - /url: "#"
  - heading "Legal" [level=3]
  - list:
    - listitem:
      - link "Privacy":
        - /url: "#"
    - listitem:
      - link "Terms":
        - /url: "#"
    - listitem:
      - link "Cookies":
        - /url: "#"
    - listitem:
      - link "Licenses":
        - /url: "#"
  - text: © 2025 Content AI Agent. All rights reserved.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import path from 'path';
   3 |
   4 | test.describe('Complete User Flow - Image Generation with Flux LoRA Models', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     // Navigate to the home page
   7 |     await page.goto('/');
   8 |     
   9 |     // Wait for the page to load
   10 |     await page.waitForLoadState('networkidle');
   11 |   });
   12 |
   13 |   test('User can navigate to models and generate images with Jaime model', async ({ page }) => {
   14 |     // Navigate to models page
>  15 |     await page.click('text=Models');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
   16 |     await page.waitForURL('**/models');
   17 |     
   18 |     // Verify models page loads
   19 |     await expect(page.locator('h1')).toContainText('AI Models');
   20 |     
   21 |     // Find and click on Jaime model
   22 |     await page.click('text=Jaime Creator');
   23 |     await page.waitForURL('**/models/jaime');
   24 |     
   25 |     // Verify Jaime model page loads
   26 |     await expect(page.locator('h1')).toContainText('Jaime Creator');
   27 |     
   28 |     // Fill in the prompt
   29 |     const prompt = 'JAIME wearing a professional suit, business portrait, high quality';
   30 |     await page.fill('textarea[placeholder*="prompt"]', prompt);
   31 |     
   32 |     // Click generate button
   33 |     await page.click('button:has-text("Generate Image")');
   34 |     
   35 |     // Wait for generation to start (loading state)
   36 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
   37 |     
   38 |     // Wait for generation to complete (this might take 15-30 seconds)
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
```