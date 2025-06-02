# Test info

- Name: Debug Login Process >> Debug login form interaction
- Location: /Users/JackEllis/THE WAY /e2e/unauthenticated/debug-login.spec.ts:4:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('button:has-text("Sign out"), button:has-text("Logout")') resolved to 2 elements:
    1) <button aria-label="Sign out" class="inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:ring-2 hover:ring-primary/40 h-10 px-4 py-2 text-sm whitespace-nowrap">…</button> aka locator('div').filter({ hasText: /^optimalpost\.aiAAdmin UserSign Out$/ }).getByLabel('Sign out')
    2) <button tabindex="-1" aria-label="Sign out" class="inline-flex items-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:shadow-sm hover:ring-2 hover:ring-primary/40 h-10 text-sm font-medium transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 justify-start text-red-600 dark:text-red-500 dark:hover:bg-red-900/20 hover:text-red-700">…</button> aka locator('div').filter({ hasText: /^AAdmin UserSign Out$/ }).getByLabel('Sign out')

Call log:
    - checking visibility of locator('button:has-text("Sign out"), button:has-text("Logout")')

    at /Users/JackEllis/THE WAY /e2e/unauthenticated/debug-login.spec.ts:74:46
```

# Page snapshot

```yaml
- dialog "Welcome to Your Content AI Agent, Admin User!":
  - heading "Welcome to Your Content AI Agent, Admin User!" [level=2]
  - paragraph: "You're all set up! Here's what creators are doing on The Way:"
  - img
  - heading "Create Custom Model" [level=3]
  - paragraph: Create AI-generated images of yourself in various styles and scenarios.
  - button "Get Started":
    - link "Get Started":
      - /url: /models
      - text: Get Started
      - img
  - img
  - heading "Analyze Your Post" [level=3]
  - paragraph: Get insights and optimization tips to improve your social media content.
  - button "Analyze Content":
    - link "Analyze Content":
      - /url: /upload-post
      - text: Analyze Content
      - img
  - img
  - heading "Track Social Trends" [level=3]
  - paragraph: Monitor what's performing well and stay ahead of trending topics.
  - button "View Trends":
    - link "View Trends":
      - /url: /dashboard
      - text: View Trends
      - img
  - text: Please take a moment to explore your options...
  - button "Close":
    - img
    - text: Close
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Debug Login Process', () => {
   4 |   test('Debug login form interaction', async ({ page }) => {
   5 |     console.log('🔍 Starting login debug...');
   6 |     
   7 |     // Navigate to login page
   8 |     await page.goto('/auth/login');
   9 |     await page.waitForLoadState('networkidle');
  10 |     
  11 |     // Take initial screenshot
  12 |     await page.screenshot({ path: 'debug-login-initial.png', fullPage: true });
  13 |     
  14 |     // Check what's on the page
  15 |     const title = await page.title();
  16 |     console.log('Login page title:', title);
  17 |     
  18 |     // Check for form elements
  19 |     const emailInput = page.locator('input[type="email"]');
  20 |     const passwordInput = page.locator('input[type="password"]');
  21 |     const submitButton = page.locator('button[type="submit"]');
  22 |     
  23 |     const emailVisible = await emailInput.isVisible();
  24 |     const passwordVisible = await passwordInput.isVisible();
  25 |     const submitVisible = await submitButton.isVisible();
  26 |     
  27 |     console.log('Form elements visible:', {
  28 |       email: emailVisible,
  29 |       password: passwordVisible,
  30 |       submit: submitVisible
  31 |     });
  32 |     
  33 |     if (emailVisible && passwordVisible && submitVisible) {
  34 |       console.log('✅ All form elements found, attempting login...');
  35 |       
  36 |       // Fill the form
  37 |       await emailInput.fill('admin@example.com');
  38 |       await passwordInput.fill('admin123');
  39 |       
  40 |       // Take screenshot before submit
  41 |       await page.screenshot({ path: 'debug-login-filled.png', fullPage: true });
  42 |       
  43 |       // Click submit
  44 |       await submitButton.click();
  45 |       
  46 |       // Wait a bit and see what happens
  47 |       await page.waitForTimeout(3000);
  48 |       
  49 |       // Take screenshot after submit
  50 |       await page.screenshot({ path: 'debug-login-after-submit.png', fullPage: true });
  51 |       
  52 |       // Check current URL
  53 |       const currentUrl = page.url();
  54 |       console.log('URL after submit:', currentUrl);
  55 |       
  56 |       // Check for welcome modal
  57 |       const welcomeModal = page.locator('dialog:has-text("Welcome to Your Content AI Agent")');
  58 |       const hasWelcomeModal = await welcomeModal.isVisible();
  59 |       console.log('Welcome modal visible:', hasWelcomeModal);
  60 |       
  61 |       // Check for any error messages
  62 |       const errorMessages = await page.locator('[role="alert"], .error, .alert-error').all();
  63 |       console.log('Error messages found:', errorMessages.length);
  64 |       
  65 |       for (let i = 0; i < errorMessages.length; i++) {
  66 |         const text = await errorMessages[i].textContent();
  67 |         console.log(`Error ${i + 1}:`, text);
  68 |       }
  69 |       
  70 |       // Check for success indicators
  71 |       const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
  72 |       const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
  73 |       
> 74 |       const hasSignOut = await signOutButton.isVisible();
     |                                              ^ Error: locator.isVisible: Error: strict mode violation: locator('button:has-text("Sign out"), button:has-text("Logout")') resolved to 2 elements:
  75 |       const hasUserMenu = await userMenu.isVisible();
  76 |       
  77 |       console.log('Success indicators:', {
  78 |         signOut: hasSignOut,
  79 |         userMenu: hasUserMenu
  80 |       });
  81 |       
  82 |     } else {
  83 |       console.log('❌ Form elements not found');
  84 |       
  85 |       // Check what elements are actually on the page
  86 |       const allButtons = await page.locator('button').all();
  87 |       console.log('All buttons found:', allButtons.length);
  88 |       
  89 |       for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
  90 |         const text = await allButtons[i].textContent();
  91 |         const type = await allButtons[i].getAttribute('type');
  92 |         console.log(`Button ${i + 1}: "${text}" (type: ${type})`);
  93 |       }
  94 |     }
  95 |   });
  96 | }); 
```