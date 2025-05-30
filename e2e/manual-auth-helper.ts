import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Manual Authentication Helper
 * 
 * This helper allows you to manually authenticate and save the session state.
 * 
 * Usage:
 * 1. Run: npx playwright test e2e/manual-auth-helper.ts --headed
 * 2. The browser will open to the login page
 * 3. Manually log in using your preferred method
 * 4. The test will wait for you to complete login and save the session
 * 5. Use the saved session in other tests
 */

setup('manual authentication', async ({ page }) => {
  console.log('🔐 Manual Authentication Helper');
  console.log('================================');
  console.log('1. A browser window will open to the login page');
  console.log('2. Please log in manually using your preferred method');
  console.log('3. After successful login, the test will automatically save your session');
  console.log('4. You can then use this session for other tests');
  console.log('');
  
  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  console.log('📱 Login page loaded. Please complete the login process...');
  
  // Wait for user to manually log in
  // We'll wait for either:
  // 1. Redirect to home page (/)
  // 2. Presence of user menu/logout button
  // 3. Absence of login form
  
  try {
    // Wait for one of these conditions to indicate successful login
    await Promise.race([
      // Wait for redirect to home page
      page.waitForURL('/', { timeout: 60000 }),
      
      // Wait for user menu to appear
      page.waitForSelector('button:has-text("Sign out"), [data-testid="user-menu"], .user-menu', { timeout: 60000 }),
      
      // Wait for login form to disappear
      page.waitForSelector('input[type="email"]', { state: 'hidden', timeout: 60000 })
    ]);
    
    console.log('✅ Login detected! Saving authentication state...');
    
    // Save the authentication state
    await page.context().storageState({ path: authFile });
    
    console.log('💾 Authentication state saved to:', authFile);
    console.log('');
    console.log('🎉 Success! You can now run authenticated tests using:');
    console.log('   npx playwright test --project=chromium-authenticated');
    
  } catch (error) {
    console.log('❌ Login timeout or failed. Please try again.');
    console.log('Make sure to complete the login process within 60 seconds.');
    throw error;
  }
});

// Alternative: Save current browser session
setup('save current session', async ({ page }) => {
  console.log('💾 Saving current browser session...');
  
  // Go to home page to check if already logged in
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Check if user is already logged in
  const isLoggedIn = await page.locator('button:has-text("Sign out"), [data-testid="user-menu"], .user-menu').isVisible();
  
  if (isLoggedIn) {
    await page.context().storageState({ path: authFile });
    console.log('✅ Session saved successfully!');
  } else {
    console.log('❌ No active session found. Please log in first.');
    throw new Error('No active session to save');
  }
}); 