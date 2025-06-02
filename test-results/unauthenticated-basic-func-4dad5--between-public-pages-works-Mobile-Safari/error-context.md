# Test info

- Name: Unauthenticated User Flow >> Navigation between public pages works
- Location: /Users/JackEllis/THE WAY /e2e/unauthenticated/basic-functionality.spec.ts:138:7

# Error details

```
Error: locator.click: Error: strict mode violation: locator('a[href="/"], nav a:has-text("Home")') resolved to 2 elements:
    1) <a href="/" tabindex="0" aria-label="Go to home page" class="flex items-center gap-3 text-lg font-semibold hover:opacity-90 transition-opacity rounded-md p-1 focus:outline-none border-0 whitespace-nowrap">…</a> aka getByRole('link', { name: 'Go to home page' })
    2) <a href="/" class="flex items-center gap-2 hover:opacity-90 transition-opacity">…</a> aka getByRole('link', { name: 'optimalpost.ai' })

Call log:
  - waiting for locator('a[href="/"], nav a:has-text("Home")')
    - locator resolved to <a href="/" tabindex="0" aria-label="Go to home page" class="flex items-center gap-2 text-lg font-semibold">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="group bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">…</div> from <div role="dialog" tabindex="-1" id="radix-«R1l7»" data-state="closed" data-slot="dialog-content" aria-labelledby="radix-«R1l7H1»" aria-describedby="radix-«R1l7H2»" class="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow…>…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="group bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">…</div> from <div role="dialog" tabindex="-1" id="radix-«R1l7»" data-state="closed" data-slot="dialog-content" aria-labelledby="radix-«R1l7H1»" aria-describedby="radix-«R1l7H2»" class="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow…>…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

    at /Users/JackEllis/THE WAY /e2e/unauthenticated/basic-functionality.spec.ts:155:24
```

# Page snapshot

```yaml
- button "Open Next.js Dev Tools":
  - img
- alert: Image Creator
- banner:
  - button "Toggle sidebar" [expanded]:
    - img
  - link "Go to home page":
    - /url: /
    - img
    - text: optimalpost.ai
  - button "View notifications":
    - img
  - navigation:
    - link "Test AI Models":
      - /url: /models
      - text: Test Models
    - link "Test API Connections":
      - /url: /api-test
      - text: API Tests
    - link "Browse gallery":
      - /url: /gallery
      - text: Gallery
    - link "Chat with AI":
      - /url: /chat
      - text: Chat
    - link "Edit photos with AI":
      - /url: /photo-editor
      - text: Photo Editor
    - link "Analyze a post":
      - /url: /upload-post
      - text: Analyze Post
    - link "Go to dashboard":
      - /url: /dashboard
      - text: Dashboard
    - link "View profile":
      - /url: /profile
      - text: Profile
    - button "Sign out": Sign Out
- complementary:
  - link "optimalpost.ai":
    - /url: /
    - img
    - text: optimalpost.ai
  - button "Close sidebar":
    - text: Close sidebar
    - img
  - navigation:
    - link "Action Items":
      - /url: /dashboard
      - img
      - text: Action Items
    - link "Create Content":
      - /url: /models
      - img
      - text: Create Content
    - link "Analyze a Post":
      - /url: /upload-post
      - img
      - text: Analyze a Post
    - link "My Expert Chat":
      - /url: /chat
      - img
      - text: My Expert Chat
    - link "My Gallery":
      - /url: /gallery
      - img
      - text: My Gallery
    - link "Profile":
      - /url: /profile
      - img
      - text: Profile
- main:
  - heading "My Models" [level=1]
  - paragraph: Manage your trained AI models
  - button "Cleanup Failed Models" [disabled]:
    - img
    - text: Cleanup Failed Models
  - button "All"
  - button "Create a new model":
    - img
    - text: Train New Model
  - heading "No Custom Models Yet" [level=3]
  - paragraph: You haven't created any custom models yet. Start by training your first model.
  - button "Train Your First Model":
    - img
    - text: Train Your First Model
  - heading "Debug Info" [level=3]
  - paragraph: "Models fetched: 0 | Loading: No | Error: None | User authenticated: Yes | Browser: Other"
  - link "🔧 Open Debug Tool":
    - /url: /debug/models
  - button "🔄 Retry Fetch"
```

# Test source

```ts
   55 |       
   56 |       await page.goto(modelUrl);
   57 |       await page.waitForLoadState('networkidle');
   58 |       
   59 |       // Take screenshot
   60 |       const screenshotName = modelUrl.replace(/\//g, '-').substring(1);
   61 |       await page.screenshot({ path: `test-results/${screenshotName}.png`, fullPage: true });
   62 |       
   63 |       // Check if page loads (might redirect to login or show content)
   64 |       const currentUrl = page.url();
   65 |       console.log(`${modelUrl} - Current URL after navigation:`, currentUrl);
   66 |       
   67 |       // If redirected to login, that's expected behavior
   68 |       if (currentUrl.includes('/auth/login')) {
   69 |         console.log(`${modelUrl} - Redirected to login (expected for protected route)`);
   70 |         continue;
   71 |       }
   72 |       
   73 |       // If we can access the page, check its structure
   74 |       const h1Elements = await page.locator('h1').all();
   75 |       for (let i = 0; i < h1Elements.length; i++) {
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
> 155 |         await homeLink.click();
      |                        ^ Error: locator.click: Error: strict mode violation: locator('a[href="/"], nav a:has-text("Home")') resolved to 2 elements:
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
  176 |     expect(currentUrl).toContain('/auth/login');
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