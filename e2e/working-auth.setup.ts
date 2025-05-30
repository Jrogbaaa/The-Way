import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate and save session', async ({ page }) => {
  console.log('🔐 Logging in with test credentials...');
  
  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Fill the login form with test credentials
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect to home page
  await page.waitForURL('/', { timeout: 10000 });
  
  console.log('✅ Login successful - redirected to home page');
  
  // Verify we're logged in by checking for user session indicators
  // Use .first() to avoid strict mode violations
  const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
  await expect(signOutButton).toBeVisible({ timeout: 5000 });
  
  console.log('✅ User session confirmed - sign out button visible');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('💾 Authentication state saved to:', authFile);
  console.log('🎉 Ready for authenticated tests!');
}); 