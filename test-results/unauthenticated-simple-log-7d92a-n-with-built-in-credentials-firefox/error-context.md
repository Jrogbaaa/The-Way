# Test info

- Name: Simple Login Test >> Test login with built-in credentials
- Location: /Users/JackEllis/THE WAY /e2e/unauthenticated/simple-login-test.spec.ts:4:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('input[type="email"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('input[type="email"]')

    at /Users/JackEllis/THE WAY /e2e/unauthenticated/simple-login-test.spec.ts:24:30
```

# Page snapshot

```yaml
- banner:
  - link "Go to home page":
    - /url: /
    - img
    - text: optimalpost.ai
  - navigation
- main:
  - heading "We know what's best for your social media. We're gonna show you how it's done." [level=1]
  - paragraph: Our AI-powered platform guides you through content creation, targeting, and distribution in one seamless flow.
  - button "Try our tools":
    - text: Create Posts
    - img
  - paragraph: No login required • Try instantly
  - img
  - text: AI-driven targeting
  - img
  - text: Integrated analytics
  - img
  - text: Content calendar
  - img
  - img
  - text: AI-Generated
  - paragraph: Trusted by content creators worldwide
  - heading "The complete content creation workflow" [level=2]
  - paragraph: Our streamlined process takes you from idea to publishable content in minutes
  - img
  - heading "1. AI-Powered Ideas" [level=3]
  - paragraph: Tell us your goal and audience, and our AI generates tailored content ideas
  - button "Try Now"
  - img
  - heading "2. Create & Refine" [level=3]
  - paragraph: Instantly transform ideas into visuals, captions, and engaging content
  - button "Try Now"
  - img
  - heading "3. Target & Optimize" [level=3]
  - paragraph: Get AI-suggested @mentions and optimize content for maximum engagement
  - button "Try Now"
  - heading "Ready to transform your social media content?" [level=2]
  - paragraph: Join thousands of creators who are saving time and getting better results
  - button "Try our tools without login": Try Without Login
  - link "Sign up for a free trial":
    - /url: /auth/signup
    - text: Start Free Trial
  - paragraph: Experience the value first • No login required
- contentinfo:
  - img
  - text: Content AI Agent
  - paragraph: Empowering content creators with AI-powered tools for better social media content.
  - heading "Product" [level=3]
  - list:
    - listitem:
      - link "Features":
        - /url: "#"
    - listitem:
      - link "Pricing":
        - /url: "#"
    - listitem:
      - link "Documentation":
        - /url: "#"
    - listitem:
      - link "Roadmap":
        - /url: "#"
  - heading "Company" [level=3]
  - list:
    - listitem:
      - link "About":
        - /url: "#"
    - listitem:
      - link "Blog":
        - /url: "#"
    - listitem:
      - link "Careers":
        - /url: "#"
    - listitem:
      - link "Contact":
        - /url: "#"
  - heading "Legal" [level=3]
  - list:
    - listitem:
      - link "Privacy":
        - /url: "#"
    - listitem:
      - link "Terms":
        - /url: "#"
    - listitem:
      - link "Cookies":
        - /url: "#"
    - listitem:
      - link "Licenses":
        - /url: "#"
  - text: © 2025 Content AI Agent. All rights reserved.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Simple Login Test', () => {
   4 |   test('Test login with built-in credentials', async ({ page }) => {
   5 |     console.log('🔍 Testing login with admin@example.com...');
   6 |     
   7 |     // Navigate to login page
   8 |     await page.goto('/auth/login');
   9 |     await page.waitForLoadState('networkidle');
  10 |     
  11 |     // Take initial screenshot
  12 |     await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
  13 |     
  14 |     // Check page title
  15 |     const title = await page.title();
  16 |     console.log('Login page title:', title);
  17 |     
  18 |     // Check for form elements
  19 |     const emailInput = page.locator('input[type="email"]');
  20 |     const passwordInput = page.locator('input[type="password"]');
  21 |     const submitButton = page.locator('button[type="submit"]');
  22 |     
  23 |     // Verify form elements are visible
> 24 |     await expect(emailInput).toBeVisible();
     |                              ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  25 |     await expect(passwordInput).toBeVisible();
  26 |     await expect(submitButton).toBeVisible();
  27 |     
  28 |     console.log('✅ All form elements found');
  29 |     
  30 |     // Fill the form with test credentials
  31 |     await emailInput.fill('admin@example.com');
  32 |     await passwordInput.fill('admin123');
  33 |     
  34 |     console.log('✅ Form filled with test credentials');
  35 |     
  36 |     // Take screenshot before submit
  37 |     await page.screenshot({ path: 'test-results/login-filled.png', fullPage: true });
  38 |     
  39 |     // Click submit
  40 |     await submitButton.click();
  41 |     
  42 |     console.log('✅ Submit button clicked');
  43 |     
  44 |     // Wait for navigation or error
  45 |     await page.waitForTimeout(5000);
  46 |     
  47 |     // Take screenshot after submit
  48 |     await page.screenshot({ path: 'test-results/login-after-submit.png', fullPage: true });
  49 |     
  50 |     // Check current URL
  51 |     const currentUrl = page.url();
  52 |     console.log('Current URL after submit:', currentUrl);
  53 |     
  54 |     // Check for error messages
  55 |     const errorAlert = page.locator('[role="alert"]');
  56 |     const errorVisible = await errorAlert.isVisible();
  57 |     
  58 |     if (errorVisible) {
  59 |       const errorText = await errorAlert.textContent();
  60 |       console.log('❌ Error message:', errorText);
  61 |     } else {
  62 |       console.log('✅ No error messages visible');
  63 |     }
  64 |     
  65 |     // Check if we're redirected to home page (success)
  66 |     if (currentUrl.includes('localhost:3000/') && !currentUrl.includes('/auth/login')) {
  67 |       console.log('✅ Login appears successful - redirected away from login page');
  68 |       
  69 |       // Look for logout/user menu indicators
  70 |       const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
  71 |       const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
  72 |       
  73 |       const hasSignOut = await signOutButton.isVisible();
  74 |       const hasUserMenu = await userMenu.isVisible();
  75 |       
  76 |       console.log('User session indicators:', {
  77 |         signOut: hasSignOut,
  78 |         userMenu: hasUserMenu,
  79 |         url: currentUrl
  80 |       });
  81 |       
  82 |     } else {
  83 |       console.log('❌ Still on login page - login may have failed');
  84 |     }
  85 |   });
  86 | }); 
```