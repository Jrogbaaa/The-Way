import { test, expect } from '@playwright/test';

test.describe('Detailed Login Debug', () => {
  test('Debug login with console and network monitoring', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Capture network requests
    const networkRequests: string[] = [];
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });
    
    // Capture network responses
    const networkResponses: string[] = [];
    page.on('response', response => {
      networkResponses.push(`${response.status()} ${response.url()}`);
    });
    
    console.log('🔍 Starting detailed login debug...');
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📄 Login page loaded');
    
    // Fill the form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    console.log('📝 Form filled with credentials');
    
    // Monitor the submit request
    const submitPromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/') && response.request().method() === 'POST'
    );
    
    // Click submit
    await page.click('button[type="submit"]');
    
    console.log('🔄 Submit button clicked, waiting for auth response...');
    
    try {
      const authResponse = await submitPromise;
      const status = authResponse.status();
      const url = authResponse.url();
      
      console.log(`🌐 Auth response: ${status} ${url}`);
      
      if (status === 200) {
        console.log('✅ Auth request successful');
      } else {
        console.log(`❌ Auth request failed with status ${status}`);
      }
      
    } catch (error) {
      console.log('❌ No auth response captured or timeout');
    }
    
    // Wait for any redirects or updates
    await page.waitForTimeout(3000);
    
    // Check final state
    const finalUrl = page.url();
    console.log('🏁 Final URL:', finalUrl);
    
    // Log all console messages
    console.log('\n📋 Console Messages:');
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });
    
    // Log network requests
    console.log('\n🌐 Network Requests:');
    networkRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req}`);
    });
    
    // Log network responses
    console.log('\n📡 Network Responses:');
    networkResponses.forEach((res, i) => {
      console.log(`  ${i + 1}. ${res}`);
    });
    
    // Check for specific error elements
    const errorElements = await page.locator('[role="alert"], .error, .alert-error, .text-red-500, .text-destructive').all();
    
    if (errorElements.length > 0) {
      console.log('\n❌ Error elements found:');
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log(`  ${i + 1}. ${text}`);
      }
    } else {
      console.log('\n✅ No error elements found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/detailed-login-debug.png', fullPage: true });
  });
}); 