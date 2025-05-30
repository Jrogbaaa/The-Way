# Test info

- Name: Detailed Login Debug >> Debug login with console and network monitoring
- Location: /Users/JackEllis/THE WAY /e2e/unauthenticated/detailed-login-debug.spec.ts:4:7

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

    at /Users/JackEllis/THE WAY /e2e/unauthenticated/detailed-login-debug.spec.ts:32:16
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
   3 | test.describe('Detailed Login Debug', () => {
   4 |   test('Debug login with console and network monitoring', async ({ page }) => {
   5 |     // Capture console messages
   6 |     const consoleMessages: string[] = [];
   7 |     page.on('console', msg => {
   8 |       consoleMessages.push(`${msg.type()}: ${msg.text()}`);
   9 |     });
   10 |     
   11 |     // Capture network requests
   12 |     const networkRequests: string[] = [];
   13 |     page.on('request', request => {
   14 |       networkRequests.push(`${request.method()} ${request.url()}`);
   15 |     });
   16 |     
   17 |     // Capture network responses
   18 |     const networkResponses: string[] = [];
   19 |     page.on('response', response => {
   20 |       networkResponses.push(`${response.status()} ${response.url()}`);
   21 |     });
   22 |     
   23 |     console.log('🔍 Starting detailed login debug...');
   24 |     
   25 |     // Navigate to login page
   26 |     await page.goto('/auth/login');
   27 |     await page.waitForLoadState('networkidle');
   28 |     
   29 |     console.log('📄 Login page loaded');
   30 |     
   31 |     // Fill the form
>  32 |     await page.fill('input[type="email"]', 'admin@example.com');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
   33 |     await page.fill('input[type="password"]', 'admin123');
   34 |     
   35 |     console.log('📝 Form filled with credentials');
   36 |     
   37 |     // Monitor the submit request
   38 |     const submitPromise = page.waitForResponse(response => 
   39 |       response.url().includes('/api/auth/') && response.request().method() === 'POST'
   40 |     );
   41 |     
   42 |     // Click submit
   43 |     await page.click('button[type="submit"]');
   44 |     
   45 |     console.log('🔄 Submit button clicked, waiting for auth response...');
   46 |     
   47 |     try {
   48 |       const authResponse = await submitPromise;
   49 |       const status = authResponse.status();
   50 |       const url = authResponse.url();
   51 |       
   52 |       console.log(`🌐 Auth response: ${status} ${url}`);
   53 |       
   54 |       if (status === 200) {
   55 |         console.log('✅ Auth request successful');
   56 |       } else {
   57 |         console.log(`❌ Auth request failed with status ${status}`);
   58 |       }
   59 |       
   60 |     } catch (error) {
   61 |       console.log('❌ No auth response captured or timeout');
   62 |     }
   63 |     
   64 |     // Wait for any redirects or updates
   65 |     await page.waitForTimeout(3000);
   66 |     
   67 |     // Check final state
   68 |     const finalUrl = page.url();
   69 |     console.log('🏁 Final URL:', finalUrl);
   70 |     
   71 |     // Log all console messages
   72 |     console.log('\n📋 Console Messages:');
   73 |     consoleMessages.forEach((msg, i) => {
   74 |       console.log(`  ${i + 1}. ${msg}`);
   75 |     });
   76 |     
   77 |     // Log network requests
   78 |     console.log('\n🌐 Network Requests:');
   79 |     networkRequests.forEach((req, i) => {
   80 |       console.log(`  ${i + 1}. ${req}`);
   81 |     });
   82 |     
   83 |     // Log network responses
   84 |     console.log('\n📡 Network Responses:');
   85 |     networkResponses.forEach((res, i) => {
   86 |       console.log(`  ${i + 1}. ${res}`);
   87 |     });
   88 |     
   89 |     // Check for specific error elements
   90 |     const errorElements = await page.locator('[role="alert"], .error, .alert-error, .text-red-500, .text-destructive').all();
   91 |     
   92 |     if (errorElements.length > 0) {
   93 |       console.log('\n❌ Error elements found:');
   94 |       for (let i = 0; i < errorElements.length; i++) {
   95 |         const text = await errorElements[i].textContent();
   96 |         console.log(`  ${i + 1}. ${text}`);
   97 |       }
   98 |     } else {
   99 |       console.log('\n✅ No error elements found');
  100 |     }
  101 |     
  102 |     // Take final screenshot
  103 |     await page.screenshot({ path: 'test-results/detailed-login-debug.png', fullPage: true });
  104 |   });
  105 | }); 
```