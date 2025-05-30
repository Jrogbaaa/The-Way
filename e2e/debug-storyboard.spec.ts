import { test, expect } from '@playwright/test';

test.describe('Debug Storyboard Page', () => {
  test('Check storyboard page loads and elements are present', async ({ page }) => {
    console.log('🔍 Testing storyboard page...');
    
    // Navigate to storyboard page
    await page.goto('/storyboard-creator');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/storyboard-page.png', fullPage: true });
    
    // Check page title
    const title = await page.title();
    console.log('Storyboard page title:', title);
    
    // Check for main heading
    const h1 = page.locator('h1');
    const h1Text = await h1.textContent();
    console.log('H1 text:', h1Text);
    
    // Check for form elements
    const titleInput = page.locator('input[placeholder*="title"], input[id="title"]');
    const descriptionInput = page.locator('textarea[placeholder*="description"], textarea[id="description"]');
    const fileInputs = page.locator('input[type="file"]');
    
    const titleVisible = await titleInput.isVisible();
    const descriptionVisible = await descriptionInput.isVisible();
    const fileInputCount = await fileInputs.count();
    
    console.log('Form elements:', {
      titleInput: titleVisible,
      descriptionInput: descriptionVisible,
      fileInputs: fileInputCount
    });
    
    // Check for any buttons
    const buttons = await page.locator('button').all();
    console.log('Buttons found:', buttons.length);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i + 1}: "${text}"`);
    }
    
    // Check for any error messages
    const errorElements = await page.locator('[role="alert"], .error, .alert-error').all();
    console.log('Error elements found:', errorElements.length);
    
    if (errorElements.length > 0) {
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log(`Error ${i + 1}: ${text}`);
      }
    }
  });
}); 