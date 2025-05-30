# Test info

- Name: Unauthenticated User Flow >> Authentication prompts work correctly
- Location: /Users/JackEllis/THE WAY /e2e/unauthenticated/basic-functionality.spec.ts:164:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/auth/login"
Received string:    "http://localhost:3000/dashboard"
    at /Users/JackEllis/THE WAY /e2e/unauthenticated/basic-functionality.spec.ts:176:24
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
   76 |         const text = await h1Elements[i].textContent();
   77 |         console.log(`${modelUrl} - H1 ${i + 1}:`, text);
   78 |       }
   79 |       
   80 |       // Check for form elements
   81 |       const promptInputs = page.locator('textarea[placeholder*="prompt"], input[placeholder*="prompt"]');
   82 |       const generateButtons = page.locator('button:has-text("Generate"), button[type="submit"]');
   83 |       
   84 |       const promptCount = await promptInputs.count();
   85 |       const buttonCount = await generateButtons.count();
   86 |       
   87 |       console.log(`${modelUrl} - Prompt inputs: ${promptCount}, Generate buttons: ${buttonCount}`);
   88 |       
   89 |       // If there are form elements, try interacting with them
   90 |       if (promptCount > 0) {
   91 |         const firstPromptInput = promptInputs.first();
   92 |         const isVisible = await firstPromptInput.isVisible();
   93 |         const isEnabled = await firstPromptInput.isEnabled();
   94 |         
   95 |         console.log(`${modelUrl} - First prompt input visible: ${isVisible}, enabled: ${isEnabled}`);
   96 |         
   97 |         if (isVisible && isEnabled) {
   98 |           // Try to fill the prompt
   99 |           await firstPromptInput.fill('Test prompt for automated testing');
  100 |           
  101 |           // Check if generate button becomes enabled
  102 |           if (buttonCount > 0) {
  103 |             const firstButton = generateButtons.first();
  104 |             const buttonEnabled = await firstButton.isEnabled();
  105 |             console.log(`${modelUrl} - Generate button enabled after filling prompt: ${buttonEnabled}`);
  106 |             
  107 |             // If button is enabled, we could try clicking it to see what happens
  108 |             // (but we won't actually generate images in this test)
  109 |           }
  110 |         }
  111 |       }
  112 |     }
  113 |   });
  114 |
  115 |   test('Social analyzer tool is accessible', async ({ page }) => {
  116 |     await page.goto('/social-analyzer');
  117 |     await page.waitForLoadState('networkidle');
  118 |     
  119 |     // Take screenshot
  120 |     await page.screenshot({ path: 'test-results/social-analyzer.png', fullPage: true });
  121 |     
  122 |     const currentUrl = page.url();
  123 |     console.log('Social analyzer URL:', currentUrl);
  124 |     
  125 |     // Check if we can access this tool without auth
  126 |     if (!currentUrl.includes('/auth/login')) {
  127 |       // Look for upload or input elements
  128 |       const fileInputs = page.locator('input[type="file"]');
  129 |       const textInputs = page.locator('textarea, input[type="text"]');
  130 |       
  131 |       const fileCount = await fileInputs.count();
  132 |       const textCount = await textInputs.count();
  133 |       
  134 |       console.log('Social analyzer - File inputs:', fileCount, 'Text inputs:', textCount);
  135 |     }
  136 |   });
  137 |
  138 |   test('Navigation between public pages works', async ({ page }) => {
  139 |     // Start at homepage
  140 |     await page.goto('/');
  141 |     await page.waitForLoadState('networkidle');
  142 |     
  143 |     // Try to navigate to models
  144 |     const modelsLink = page.locator('a[href="/models"], nav a:has-text("Models")');
  145 |     if (await modelsLink.isVisible()) {
  146 |       await modelsLink.click();
  147 |       await page.waitForLoadState('networkidle');
  148 |       
  149 |       const url = page.url();
  150 |       console.log('After clicking models link:', url);
  151 |       
  152 |       // Try to go back to home
  153 |       const homeLink = page.locator('a[href="/"], nav a:has-text("Home")');
  154 |       if (await homeLink.isVisible()) {
  155 |         await homeLink.click();
  156 |         await page.waitForLoadState('networkidle');
  157 |         
  158 |         const backUrl = page.url();
  159 |         console.log('After clicking home link:', backUrl);
  160 |       }
  161 |     }
  162 |   });
  163 |
  164 |   test('Authentication prompts work correctly', async ({ page }) => {
  165 |     // Go to a protected page that should redirect to login
  166 |     await page.goto('/dashboard');
  167 |     await page.waitForLoadState('networkidle');
  168 |     
  169 |     // Take screenshot
  170 |     await page.screenshot({ path: 'test-results/auth-redirect.png', fullPage: true });
  171 |     
  172 |     const currentUrl = page.url();
  173 |     console.log('Dashboard redirect URL:', currentUrl);
  174 |     
  175 |     // Should be redirected to login
> 176 |     expect(currentUrl).toContain('/auth/login');
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  177 |     
  178 |     // Check login page structure
  179 |     const emailInput = page.locator('input[type="email"]');
  180 |     const passwordInput = page.locator('input[type="password"]');
  181 |     const submitButton = page.locator('button[type="submit"]');
  182 |     const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
  183 |     
  184 |     const hasEmail = await emailInput.isVisible();
  185 |     const hasPassword = await passwordInput.isVisible();
  186 |     const hasSubmit = await submitButton.isVisible();
  187 |     const hasGoogle = await googleButton.isVisible();
  188 |     
  189 |     console.log('Login page elements:', {
  190 |       email: hasEmail,
  191 |       password: hasPassword,
  192 |       submit: hasSubmit,
  193 |       google: hasGoogle
  194 |     });
  195 |     
  196 |     // At least one authentication method should be available
  197 |     expect(hasEmail || hasGoogle).toBeTruthy();
  198 |   });
  199 | }); 
```