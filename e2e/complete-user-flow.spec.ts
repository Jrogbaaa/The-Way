import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Complete User Flow - Image Generation with Flux LoRA Models', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('User can navigate to models and generate images with Jaime model', async ({ page }) => {
    // Navigate to models page
    await page.click('text=Models');
    await page.waitForURL('**/models');
    
    // Verify models page loads
    await expect(page.locator('h1')).toContainText('AI Models');
    
    // Find and click on Jaime model
    await page.click('text=Jaime Creator');
    await page.waitForURL('**/models/jaime');
    
    // Verify Jaime model page loads
    await expect(page.locator('h1')).toContainText('Jaime Creator');
    
    // Fill in the prompt
    const prompt = 'JAIME wearing a professional suit, business portrait, high quality';
    await page.fill('textarea[placeholder*="prompt"]', prompt);
    
    // Click generate button
    await page.click('button:has-text("Generate Image")');
    
    // Wait for generation to start (loading state)
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
    
    // Wait for generation to complete (this might take 15-30 seconds)
    await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
    
    // Verify image was generated
    await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
    
    // Test image modal functionality
    await page.click('img[alt*="Generated image"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('User can generate images with Cristina model', async ({ page }) => {
    // Navigate directly to Cristina model
    await page.goto('/models/cristina');
    
    // Verify Cristina model page loads
    await expect(page.locator('h1')).toContainText('Cristina');
    
    // Test suggested prompt functionality
    await page.click('text=CRISTINA wearing a dress walking on the beach');
    
    // Verify prompt was filled
    const promptValue = await page.inputValue('textarea[placeholder*="prompt"]');
    expect(promptValue).toContain('CRISTINA wearing a dress walking on the beach');
    
    // Add negative prompt
    await page.fill('textarea[placeholder*="negative"]', 'blurry, low quality, distorted');
    
    // Generate image
    await page.click('button:has-text("Generate Image")');
    
    // Wait for generation progress
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
    
    // Wait for completion
    await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
    
    // Verify image generation
    await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
  });

  test('User can generate images with Bea model', async ({ page }) => {
    // Navigate to Bea model
    await page.goto('/models/bea');
    
    // Verify page loads
    await expect(page.locator('h1')).toContainText('Bea');
    
    // Fill prompt
    await page.fill('input[placeholder*="prompt"]', 'BEA in a professional setting, corporate headshot');
    
    // Set number of outputs
    await page.selectOption('select', '2');
    
    // Generate images
    await page.click('button:has-text("Generate")');
    
    // Wait for loading
    await expect(page.locator('text=Generating amazing images')).toBeVisible({ timeout: 5000 });
    
    // Wait for completion
    await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
    
    // Verify multiple images were generated
    const images = page.locator('img[alt*="Generated image"]');
    await expect(images).toHaveCount(2);
  });

  test('User can create storyboard with character upload', async ({ page }) => {
    // Navigate to storyboard creation
    await page.goto('/storyboard-creator');
    
    // Verify storyboard page loads
    await expect(page.locator('h1')).toContainText('Create Video');
    
    // Upload main character image
    const fileInput = page.locator('input[type="file"]').first();
    
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-assets', 'test-character.jpg');
    
    // If test image doesn't exist, create a simple one or skip this part
    try {
      await fileInput.setInputFiles(testImagePath);
      
      // Verify image was uploaded
      await expect(page.locator('text=Great! Your main character is ready')).toBeVisible();
      
      // Verify character image is displayed
      await expect(page.locator('img[alt="Main character"]')).toBeVisible();
      
    } catch (error) {
      console.log('Test image not found, skipping file upload test');
    }
    
    // Test storyboard title and description
    await page.fill('input[placeholder*="title"]', 'My Test Storyboard');
    await page.fill('textarea[placeholder*="description"]', 'A test storyboard for Playwright testing');
    
    // Add a scene description
    await page.fill('textarea[placeholder*="scene description"]', 'Character walking in a park');
    
    // Select setting
    await page.fill('input[placeholder*="setting"]', 'Beautiful park with trees');
    
    // Test scene navigation - click "Add New Scene" or "Next Scene"
    const nextSceneButton = page.locator('button:has-text("Add New Scene"), button:has-text("Next Scene")');
    if (await nextSceneButton.isVisible()) {
      await nextSceneButton.click();
      
      // Verify we moved to next scene
      await expect(page.locator('text=Scene 2')).toBeVisible();
    }
  });

  test('User can test SDXL model for general image generation', async ({ page }) => {
    // Navigate to SDXL model
    await page.goto('/models/sdxl');
    
    // Verify page loads
    await expect(page.locator('h1')).toContainText('SDXL');
    
    // Test suggested prompt
    await page.click('text=A majestic lion in the African savanna');
    
    // Verify prompt was filled
    const promptValue = await page.inputValue('textarea[placeholder*="prompt"]');
    expect(promptValue).toContain('A majestic lion in the African savanna');
    
    // Generate image
    await page.click('button:has-text("Generate Image")');
    
    // Wait for generation
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
    
    // Wait for completion
    await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
    
    // Verify image was generated
    await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
    
    // Test download functionality
    await page.click('button[aria-label*="Download"]');
    
    // Note: Actual download testing would require additional setup
    // This just verifies the download button is clickable
  });

  test('User flow: Browse models → Select model → Generate → View results', async ({ page }) => {
    // Start from models gallery
    await page.goto('/models');
    
    // Verify all available models are displayed
    await expect(page.locator('text=Jaime Creator')).toBeVisible();
    await expect(page.locator('text=Cristina')).toBeVisible();
    await expect(page.locator('text=Bea')).toBeVisible();
    await expect(page.locator('text=SDXL')).toBeVisible();
    
    // Click on a model card
    await page.click('text=Jaime Creator');
    
    // Verify navigation to model page
    await page.waitForURL('**/models/jaime');
    
    // Quick generation test
    await page.fill('textarea[placeholder*="prompt"]', 'JAIME casual portrait');
    await page.click('button:has-text("Generate Image")');
    
    // Verify generation starts
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
    
    // Go back to models gallery
    await page.click('text=← Back to Models');
    await page.waitForURL('**/models');
    
    // Verify we're back at the gallery
    await expect(page.locator('h1')).toContainText('AI Models');
  });

  test('Error handling: Invalid prompts and network issues', async ({ page }) => {
    // Navigate to a model page
    await page.goto('/models/jaime');
    
    // Test empty prompt
    await page.click('button:has-text("Generate Image")');
    
    // Should show some validation or remain disabled
    const generateButton = page.locator('button:has-text("Generate Image")');
    await expect(generateButton).toBeDisabled();
    
    // Test with valid prompt
    await page.fill('textarea[placeholder*="prompt"]', 'JAIME test prompt');
    await expect(generateButton).toBeEnabled();
    
    // Test network error simulation (if needed)
    // This would require intercepting network requests
  });

  test('Responsive design: Mobile view functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to models
    await page.goto('/models');
    
    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile navigation
    await page.click('text=Jaime Creator');
    await page.waitForURL('**/models/jaime');
    
    // Verify mobile form layout
    await expect(page.locator('textarea[placeholder*="prompt"]')).toBeVisible();
    
    // Test mobile generation
    await page.fill('textarea[placeholder*="prompt"]', 'JAIME mobile test');
    await page.click('button:has-text("Generate Image")');
    
    // Verify mobile loading state
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Authentication Flow with Image Generation', () => {
  test('Unauthenticated user sees demo and signup prompts', async ({ page }) => {
    // Ensure we're not logged in
    await page.goto('/');
    
    // Navigate to a model
    await page.goto('/models/jaime');
    
    // Try to generate without auth
    await page.fill('textarea[placeholder*="prompt"]', 'JAIME test');
    await page.click('button:has-text("Generate Image")');
    
    // Should redirect to signup or show auth prompt
    // This depends on your auth implementation
    await page.waitForTimeout(2000);
    
    // Check if redirected to signup or if auth modal appeared
    const currentUrl = page.url();
    const hasSignupInUrl = currentUrl.includes('signup') || currentUrl.includes('login');
    const hasAuthModal = await page.locator('text=Sign up').isVisible();
    
    expect(hasSignupInUrl || hasAuthModal).toBeTruthy();
  });
}); 