import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to login page (correct route for your app)
  await page.goto('/auth/login');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
  
  // Check what authentication options are available
  const hasEmailInput = await page.locator('input[type="email"]').isVisible();
  const hasGoogleButton = await page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")').isVisible();
  
  console.log('Auth options available:', { hasEmailInput, hasGoogleButton });
  
  // Option 1: Use credentials login (admin@example.com / admin123 from your auth.ts)
  if (hasEmailInput) {
    console.log('Using credentials login...');
    
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'admin123');
    
    // Click the submit button
    await page.click('button[type="submit"]');
    
    // Wait for redirect after successful login
    // Your app redirects to "/" after login, not "/dashboard"
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify we're logged in by checking for user menu or logout button
    await expect(page.locator('button:has-text("Sign out"), [data-testid="user-menu"], .user-menu')).toBeVisible({ timeout: 5000 });
  }
  
  // Option 2: Google OAuth (if using real Google credentials)
  else if (hasGoogleButton && process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    console.log('Using Google OAuth...');
    
    await page.click('button:has-text("Continue with Google"), button:has-text("Sign in with Google")');
    
    // Handle Google OAuth flow
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
    await page.click('button:has-text("Next")');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button:has-text("Next")');
    
    // Wait for redirect back to your app
    await page.waitForURL('/', { timeout: 15000 });
  }
  
  else {
    throw new Error('No suitable authentication method found. Please check the login page structure.');
  }
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('Authentication setup completed successfully');
});

// Alternative setup for API token authentication (if needed)
setup('api-authenticate', async ({ request }) => {
  // If your app uses API tokens, you can set them up here
  const token = process.env.TEST_API_TOKEN;
  
  if (token) {
    // Test the token works
    const response = await request.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(response.ok()).toBeTruthy();
  }
}); 