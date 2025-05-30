import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate with test credentials', async ({ page }) => {
  console.log('🔐 Authenticating with test credentials...');
  
  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
  
  // Use the built-in test credentials from your auth.ts file
  // These are safe, dedicated test credentials (admin@example.com / admin123)
  const email = process.env.TEST_USER_EMAIL || 'admin@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'admin123';
  
  console.log(`Logging in with test email: ${email}`);
  
  // Fill in the login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click the submit button
  await page.click('button[type="submit"]');
  
  // Wait for successful login - handle welcome modal
  try {
    // First, wait for either URL change or welcome modal
    await Promise.race([
      page.waitForURL('/', { timeout: 10000 }),
      page.waitForURL('/dashboard', { timeout: 10000 }),
      page.waitForSelector('dialog:has-text("Welcome to Your Content AI Agent")', { timeout: 10000 })
    ]);
    
    // Check if welcome modal appeared and close it
    const welcomeModal = page.locator('dialog:has-text("Welcome to Your Content AI Agent")');
    if (await welcomeModal.isVisible()) {
      console.log('📋 Welcome modal detected, closing it...');
      
      // Try different ways to close the modal
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Skip for now")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Try pressing Escape
        await page.keyboard.press('Escape');
      }
      
      // Wait for modal to disappear and navigation to complete
      await welcomeModal.waitFor({ state: 'hidden', timeout: 5000 });
      await page.waitForURL('/', { timeout: 5000 });
    }
    
    console.log('✅ Login successful!');
    
    // Verify we're logged in by checking for user session indicators
    const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
    await expect(signOutButton).toBeVisible({ timeout: 5000 });
    
    // Save authentication state
    await page.context().storageState({ path: authFile });
    
    console.log('💾 Authentication state saved');
    
  } catch (error) {
    console.log('❌ Login failed or timed out');
    await page.screenshot({ path: 'debug-login-failed.png', fullPage: true });
    throw error;
  }
}); 