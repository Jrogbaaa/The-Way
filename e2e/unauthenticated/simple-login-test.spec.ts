import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('Test login with built-in credentials', async ({ page }) => {
    console.log('🔍 Testing login with admin@example.com...');
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    // Check page title
    const title = await page.title();
    console.log('Login page title:', title);
    
    // Check for form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Verify form elements are visible
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    console.log('✅ All form elements found');
    
    // Fill the form with test credentials
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('admin123');
    
    console.log('✅ Form filled with test credentials');
    
    // Take screenshot before submit
    await page.screenshot({ path: 'test-results/login-filled.png', fullPage: true });
    
    // Click submit
    await submitButton.click();
    
    console.log('✅ Submit button clicked');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // Take screenshot after submit
    await page.screenshot({ path: 'test-results/login-after-submit.png', fullPage: true });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);
    
    // Check for error messages
    const errorAlert = page.locator('[role="alert"]');
    const errorVisible = await errorAlert.isVisible();
    
    if (errorVisible) {
      const errorText = await errorAlert.textContent();
      console.log('❌ Error message:', errorText);
    } else {
      console.log('✅ No error messages visible');
    }
    
    // Check if we're redirected to home page (success)
    if (currentUrl.includes('localhost:3000/') && !currentUrl.includes('/auth/login')) {
      console.log('✅ Login appears successful - redirected away from login page');
      
      // Look for logout/user menu indicators
      const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      
      const hasSignOut = await signOutButton.isVisible();
      const hasUserMenu = await userMenu.isVisible();
      
      console.log('User session indicators:', {
        signOut: hasSignOut,
        userMenu: hasUserMenu,
        url: currentUrl
      });
      
    } else {
      console.log('❌ Still on login page - login may have failed');
    }
  });
}); 