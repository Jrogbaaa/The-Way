import { test, expect } from '@playwright/test';

test.describe('Debug Navigation Tests', () => {
  test('Check homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
    
    // Check what's actually on the page
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for common elements
    const h1Elements = await page.locator('h1').all();
    console.log('Number of h1 elements:', h1Elements.length);
    
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`H1 ${i + 1}:`, text);
    }
    
    // Check navigation links
    const navLinks = await page.locator('nav a, header a').all();
    console.log('Navigation links found:', navLinks.length);
    
    for (let i = 0; i < navLinks.length; i++) {
      const text = await navLinks[i].textContent();
      const href = await navLinks[i].getAttribute('href');
      console.log(`Link ${i + 1}: "${text}" -> ${href}`);
    }
  });

  test('Check models page structure', async ({ page }) => {
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'debug-models.png', fullPage: true });
    
    // Check page structure
    const url = page.url();
    console.log('Current URL:', url);
    
    const h1Elements = await page.locator('h1').all();
    console.log('H1 elements on models page:', h1Elements.length);
    
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`Models H1 ${i + 1}:`, text);
    }
    
    // Check for model cards or links
    const modelElements = await page.locator('[data-testid*="model"], .model-card, a[href*="/models/"]').all();
    console.log('Model elements found:', modelElements.length);
    
    for (let i = 0; i < modelElements.length; i++) {
      const text = await modelElements[i].textContent();
      const href = await modelElements[i].getAttribute('href');
      console.log(`Model ${i + 1}: "${text}" -> ${href}`);
    }
  });

  test('Check individual model page', async ({ page }) => {
    // Try different model URLs to see which ones exist
    const modelUrls = ['/models/jaime', '/models/cristina', '/models/bea', '/models/sdxl'];
    
    for (const url of modelUrls) {
      console.log(`\n--- Testing ${url} ---`);
      
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        // Take screenshot
        await page.screenshot({ path: `debug-${url.replace('/', '-')}.png`, fullPage: true });
        
        const pageTitle = await page.title();
        console.log(`${url} - Page title:`, pageTitle);
        
        const h1Elements = await page.locator('h1').all();
        console.log(`${url} - H1 elements:`, h1Elements.length);
        
        for (let i = 0; i < h1Elements.length; i++) {
          const text = await h1Elements[i].textContent();
          console.log(`${url} - H1 ${i + 1}:`, text);
        }
        
        // Check for form elements
        const textareas = await page.locator('textarea').all();
        const inputs = await page.locator('input[type="text"], input[placeholder*="prompt"]').all();
        const buttons = await page.locator('button').all();
        
        console.log(`${url} - Textareas: ${textareas.length}, Inputs: ${inputs.length}, Buttons: ${buttons.length}`);
        
        // Check for generate button specifically
        const generateButtons = await page.locator('button:has-text("Generate"), button[type="submit"]').all();
        console.log(`${url} - Generate buttons:`, generateButtons.length);
        
        for (let i = 0; i < generateButtons.length; i++) {
          const text = await generateButtons[i].textContent();
          const disabled = await generateButtons[i].isDisabled();
          console.log(`${url} - Generate button ${i + 1}: "${text}" (disabled: ${disabled})`);
        }
        
      } catch (error) {
        console.log(`${url} - Error:`, (error as Error).message);
      }
    }
  });

  test('Check authentication state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for auth-related elements
    const loginLinks = await page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign in")').all();
    const signupLinks = await page.locator('a[href*="signup"], button:has-text("Sign up"), button:has-text("Register")').all();
    const logoutLinks = await page.locator('button:has-text("Logout"), button:has-text("Sign out")').all();
    const userMenus = await page.locator('[data-testid="user-menu"], .user-menu, button[aria-label*="user"]').all();
    
    console.log('Authentication elements found:');
    console.log('- Login links:', loginLinks.length);
    console.log('- Signup links:', signupLinks.length);
    console.log('- Logout links:', logoutLinks.length);
    console.log('- User menus:', userMenus.length);
    
    // Check cookies and localStorage
    const cookies = await page.context().cookies();
    console.log('Cookies:', cookies.length);
    
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const value = window.localStorage.getItem(key);
          if (value) {
            items[key] = value;
          }
        }
      }
      return items;
    });
    
    console.log('LocalStorage keys:', Object.keys(localStorage));
  });
}); 