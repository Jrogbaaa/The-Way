import { test, expect } from '@playwright/test';

test.describe('Debug Login Process', () => {
  test('Debug login form interaction', async ({ page }) => {
    console.log('🔍 Starting login debug...');
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'debug-login-initial.png', fullPage: true });
    
    // Check what's on the page
    const title = await page.title();
    console.log('Login page title:', title);
    
    // Check for form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    const emailVisible = await emailInput.isVisible();
    const passwordVisible = await passwordInput.isVisible();
    const submitVisible = await submitButton.isVisible();
    
    console.log('Form elements visible:', {
      email: emailVisible,
      password: passwordVisible,
      submit: submitVisible
    });
    
    if (emailVisible && passwordVisible && submitVisible) {
      console.log('✅ All form elements found, attempting login...');
      
      // Fill the form
      await emailInput.fill('admin@example.com');
      await passwordInput.fill('admin123');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'debug-login-filled.png', fullPage: true });
      
      // Click submit
      await submitButton.click();
      
      // Wait a bit and see what happens
      await page.waitForTimeout(3000);
      
      // Take screenshot after submit
      await page.screenshot({ path: 'debug-login-after-submit.png', fullPage: true });
      
      // Check current URL
      const currentUrl = page.url();
      console.log('URL after submit:', currentUrl);
      
      // Check for welcome modal
      const welcomeModal = page.locator('dialog:has-text("Welcome to Your Content AI Agent")');
      const hasWelcomeModal = await welcomeModal.isVisible();
      console.log('Welcome modal visible:', hasWelcomeModal);
      
      // Check for any error messages
      const errorMessages = await page.locator('[role="alert"], .error, .alert-error').all();
      console.log('Error messages found:', errorMessages.length);
      
      for (let i = 0; i < errorMessages.length; i++) {
        const text = await errorMessages[i].textContent();
        console.log(`Error ${i + 1}:`, text);
      }
      
      // Check for success indicators
      const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      
      const hasSignOut = await signOutButton.isVisible();
      const hasUserMenu = await userMenu.isVisible();
      
      console.log('Success indicators:', {
        signOut: hasSignOut,
        userMenu: hasUserMenu
      });
      
    } else {
      console.log('❌ Form elements not found');
      
      // Check what elements are actually on the page
      const allButtons = await page.locator('button').all();
      console.log('All buttons found:', allButtons.length);
      
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const text = await allButtons[i].textContent();
        const type = await allButtons[i].getAttribute('type');
        console.log(`Button ${i + 1}: "${text}" (type: ${type})`);
      }
    }
  });
}); 