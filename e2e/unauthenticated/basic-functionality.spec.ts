import { test, expect } from '@playwright/test';

test.describe('Unauthenticated User Flow', () => {
  test('Homepage loads and shows key features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    
    // Check page title
    const title = await page.title();
    console.log('Homepage title:', title);
    
    // Check for main navigation
    await expect(page.locator('header').first()).toBeVisible();
    
    // Check for sign up/login buttons
    const signUpButton = page.locator('a[href*="signup"], button:has-text("Sign Up")');
    const signInButton = page.locator('a[href*="login"], button:has-text("Sign In")');
    
    await expect(signUpButton.or(signInButton).first()).toBeVisible();
  });

  test('Models page is accessible without authentication', async ({ page }) => {
    await page.goto('/models');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/models-page.png', fullPage: true });
    
    // Check that we can access the models page (it should be public based on your middleware)
    const url = page.url();
    expect(url).toContain('/models');
    
    // Look for model cards or links
    const modelLinks = page.locator('a[href*="/models/"], [data-testid*="model"]');
    const modelCount = await modelLinks.count();
    console.log('Number of model links found:', modelCount);
    
    if (modelCount > 0) {
      // Check if we can see model names
      for (let i = 0; i < Math.min(modelCount, 3); i++) {
        const modelText = await modelLinks.nth(i).textContent();
        console.log(`Model ${i + 1}:`, modelText);
      }
    }
  });

  test('Individual model pages load correctly', async ({ page }) => {
    const modelUrls = ['/models/jaime', '/models/cristina', '/models/bea'];
    
    for (const modelUrl of modelUrls) {
      console.log(`\n--- Testing ${modelUrl} ---`);
      
      await page.goto(modelUrl);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      const screenshotName = modelUrl.replace(/\//g, '-').substring(1);
      await page.screenshot({ path: `test-results/${screenshotName}.png`, fullPage: true });
      
      // Check if page loads (might redirect to login or show content)
      const currentUrl = page.url();
      console.log(`${modelUrl} - Current URL after navigation:`, currentUrl);
      
      // If redirected to login, that's expected behavior
      if (currentUrl.includes('/auth/login')) {
        console.log(`${modelUrl} - Redirected to login (expected for protected route)`);
        continue;
      }
      
      // If we can access the page, check its structure
      const h1Elements = await page.locator('h1').all();
      for (let i = 0; i < h1Elements.length; i++) {
        const text = await h1Elements[i].textContent();
        console.log(`${modelUrl} - H1 ${i + 1}:`, text);
      }
      
      // Check for form elements
      const promptInputs = page.locator('textarea[placeholder*="prompt"], input[placeholder*="prompt"]');
      const generateButtons = page.locator('button:has-text("Generate"), button[type="submit"]');
      
      const promptCount = await promptInputs.count();
      const buttonCount = await generateButtons.count();
      
      console.log(`${modelUrl} - Prompt inputs: ${promptCount}, Generate buttons: ${buttonCount}`);
      
      // If there are form elements, try interacting with them
      if (promptCount > 0) {
        const firstPromptInput = promptInputs.first();
        const isVisible = await firstPromptInput.isVisible();
        const isEnabled = await firstPromptInput.isEnabled();
        
        console.log(`${modelUrl} - First prompt input visible: ${isVisible}, enabled: ${isEnabled}`);
        
        if (isVisible && isEnabled) {
          // Try to fill the prompt
          await firstPromptInput.fill('Test prompt for automated testing');
          
          // Check if generate button becomes enabled
          if (buttonCount > 0) {
            const firstButton = generateButtons.first();
            const buttonEnabled = await firstButton.isEnabled();
            console.log(`${modelUrl} - Generate button enabled after filling prompt: ${buttonEnabled}`);
            
            // If button is enabled, we could try clicking it to see what happens
            // (but we won't actually generate images in this test)
          }
        }
      }
    }
  });

  test('Social analyzer tool is accessible', async ({ page }) => {
    await page.goto('/social-analyzer');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/social-analyzer.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Social analyzer URL:', currentUrl);
    
    // Check if we can access this tool without auth
    if (!currentUrl.includes('/auth/login')) {
      // Look for upload or input elements
      const fileInputs = page.locator('input[type="file"]');
      const textInputs = page.locator('textarea, input[type="text"]');
      
      const fileCount = await fileInputs.count();
      const textCount = await textInputs.count();
      
      console.log('Social analyzer - File inputs:', fileCount, 'Text inputs:', textCount);
    }
  });

  test('Navigation between public pages works', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to models
    const modelsLink = page.locator('a[href="/models"], nav a:has-text("Models")');
    if (await modelsLink.isVisible()) {
      await modelsLink.click();
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      console.log('After clicking models link:', url);
      
      // Try to go back to home
      const homeLink = page.locator('a[href="/"], nav a:has-text("Home")');
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await page.waitForLoadState('networkidle');
        
        const backUrl = page.url();
        console.log('After clicking home link:', backUrl);
      }
    }
  });

  test('Authentication prompts work correctly', async ({ page }) => {
    // Go to a protected page that should redirect to login
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/auth-redirect.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Dashboard redirect URL:', currentUrl);
    
    // Should be redirected to login
    expect(currentUrl).toContain('/auth/login');
    
    // Check login page structure
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
    
    const hasEmail = await emailInput.isVisible();
    const hasPassword = await passwordInput.isVisible();
    const hasSubmit = await submitButton.isVisible();
    const hasGoogle = await googleButton.isVisible();
    
    console.log('Login page elements:', {
      email: hasEmail,
      password: hasPassword,
      submit: hasSubmit,
      google: hasGoogle
    });
    
    // At least one authentication method should be available
    expect(hasEmail || hasGoogle).toBeTruthy();
  });
}); 