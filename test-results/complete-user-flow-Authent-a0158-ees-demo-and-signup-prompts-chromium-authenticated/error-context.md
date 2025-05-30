# Test info

- Name: Authentication Flow with Image Generation >> Unauthenticated user sees demo and signup prompts
- Location: /Users/JackEllis/THE WAY /e2e/complete-user-flow.spec.ts:267:7

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea[placeholder*="prompt"]')

    at /Users/JackEllis/THE WAY /e2e/complete-user-flow.spec.ts:275:16
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
  - button "Skip for now & Go to Dashboard"
  - button "Close":
    - img
    - text: Close
```

# Test source

```ts
  175 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
  176 |     
  177 |     // Wait for completion
  178 |     await expect(page.locator('text=Generated Images')).toBeVisible({ timeout: 45000 });
  179 |     
  180 |     // Verify image was generated
  181 |     await expect(page.locator('img[alt*="Generated image"]')).toBeVisible();
  182 |     
  183 |     // Test download functionality
  184 |     await page.click('button[aria-label*="Download"]');
  185 |     
  186 |     // Note: Actual download testing would require additional setup
  187 |     // This just verifies the download button is clickable
  188 |   });
  189 |
  190 |   test('User flow: Browse models → Select model → Generate → View results', async ({ page }) => {
  191 |     // Start from models gallery
  192 |     await page.goto('/models');
  193 |     
  194 |     // Verify all available models are displayed
  195 |     await expect(page.locator('text=Jaime Creator')).toBeVisible();
  196 |     await expect(page.locator('text=Cristina')).toBeVisible();
  197 |     await expect(page.locator('text=Bea')).toBeVisible();
  198 |     await expect(page.locator('text=SDXL')).toBeVisible();
  199 |     
  200 |     // Click on a model card
  201 |     await page.click('text=Jaime Creator');
  202 |     
  203 |     // Verify navigation to model page
  204 |     await page.waitForURL('**/models/jaime');
  205 |     
  206 |     // Quick generation test
  207 |     await page.fill('textarea[placeholder*="prompt"]', 'JAIME casual portrait');
  208 |     await page.click('button:has-text("Generate Image")');
  209 |     
  210 |     // Verify generation starts
  211 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
  212 |     
  213 |     // Go back to models gallery
  214 |     await page.click('text=← Back to Models');
  215 |     await page.waitForURL('**/models');
  216 |     
  217 |     // Verify we're back at the gallery
  218 |     await expect(page.locator('h1')).toContainText('AI Models');
  219 |   });
  220 |
  221 |   test('Error handling: Invalid prompts and network issues', async ({ page }) => {
  222 |     // Navigate to a model page
  223 |     await page.goto('/models/jaime');
  224 |     
  225 |     // Test empty prompt
  226 |     await page.click('button:has-text("Generate Image")');
  227 |     
  228 |     // Should show some validation or remain disabled
  229 |     const generateButton = page.locator('button:has-text("Generate Image")');
  230 |     await expect(generateButton).toBeDisabled();
  231 |     
  232 |     // Test with valid prompt
  233 |     await page.fill('textarea[placeholder*="prompt"]', 'JAIME test prompt');
  234 |     await expect(generateButton).toBeEnabled();
  235 |     
  236 |     // Test network error simulation (if needed)
  237 |     // This would require intercepting network requests
  238 |   });
  239 |
  240 |   test('Responsive design: Mobile view functionality', async ({ page }) => {
  241 |     // Set mobile viewport
  242 |     await page.setViewportSize({ width: 375, height: 667 });
  243 |     
  244 |     // Navigate to models
  245 |     await page.goto('/models');
  246 |     
  247 |     // Verify mobile layout
  248 |     await expect(page.locator('h1')).toBeVisible();
  249 |     
  250 |     // Test mobile navigation
  251 |     await page.click('text=Jaime Creator');
  252 |     await page.waitForURL('**/models/jaime');
  253 |     
  254 |     // Verify mobile form layout
  255 |     await expect(page.locator('textarea[placeholder*="prompt"]')).toBeVisible();
  256 |     
  257 |     // Test mobile generation
  258 |     await page.fill('textarea[placeholder*="prompt"]', 'JAIME mobile test');
  259 |     await page.click('button:has-text("Generate Image")');
  260 |     
  261 |     // Verify mobile loading state
  262 |     await expect(page.locator('text=Generating')).toBeVisible({ timeout: 5000 });
  263 |   });
  264 | });
  265 |
  266 | test.describe('Authentication Flow with Image Generation', () => {
  267 |   test('Unauthenticated user sees demo and signup prompts', async ({ page }) => {
  268 |     // Ensure we're not logged in
  269 |     await page.goto('/');
  270 |     
  271 |     // Navigate to a model
  272 |     await page.goto('/models/jaime');
  273 |     
  274 |     // Try to generate without auth
> 275 |     await page.fill('textarea[placeholder*="prompt"]', 'JAIME test');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  276 |     await page.click('button:has-text("Generate Image")');
  277 |     
  278 |     // Should redirect to signup or show auth prompt
  279 |     // This depends on your auth implementation
  280 |     await page.waitForTimeout(2000);
  281 |     
  282 |     // Check if redirected to signup or if auth modal appeared
  283 |     const currentUrl = page.url();
  284 |     const hasSignupInUrl = currentUrl.includes('signup') || currentUrl.includes('login');
  285 |     const hasAuthModal = await page.locator('text=Sign up').isVisible();
  286 |     
  287 |     expect(hasSignupInUrl || hasAuthModal).toBeTruthy();
  288 |   });
  289 | }); 
```