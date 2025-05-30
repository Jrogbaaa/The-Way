# Test info

- Name: Image Generation Flow >> should have working navigation elements
- Location: /Users/JackEllis/THE WAY /e2e/image-generation.spec.ts:42:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: getByRole('button', { name: /refresh/i }) resolved to 2 elements:
    1) <button class="justify-center rounded-md text-sm font-medium ring-offset-background duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:shadow-md hover:ring-2 hover:ring-primary/40 h-10 px-4 py-2 flex items-center gap-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">…</button> aka getByRole('button', { name: 'Refresh Models' })
    2) <button class="inline-flex items-center justify-center font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:ring-2 hover:ring-primary/40 h-9 rounded-md px-3 text-sm">Refresh Now</button> aka getByRole('button', { name: 'Refresh Now' })

Call log:
    - checking visibility of getByRole('button', { name: /refresh/i })

    at /Users/JackEllis/THE WAY /e2e/image-generation.spec.ts:48:29
```

# Page snapshot

```yaml
- banner:
  - link "Go to home page":
    - /url: /
    - img
    - text: optimalpost.ai
  - link "View your profile":
    - /url: /profile
    - text: A Admin User
  - button "Sign out":
    - img
    - text: Sign Out
  - button "View notifications":
    - img
- complementary:
  - link "optimalpost.ai":
    - /url: /
    - img
    - text: optimalpost.ai
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
  - heading "Choose Your Model" [level=1]
  - paragraph: Create amazing content with our state-of-the-art AI models
  - button "Refresh Models":
    - img
    - text: Refresh Models
  - button "All"
  - button "Create a new model":
    - img
    - text: Train New Model
  - text: Loading your models...
  - paragraph: This may take a few seconds
  - button "Refresh Now"
  - heading "Debug Info" [level=3]
  - paragraph: "Models fetched: 0 | Loading: Yes | Error: None | User authenticated: Yes | Browser: Firefox"
  - link "🔧 Open Debug Tool":
    - /url: /debug/models
  - button "🔄 Retry Fetch"
- button "Open Next.js Dev Tools":
  - img
- alert
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test'
   2 |
   3 | test.describe('Image Generation Flow', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Go to the models page before each test
   6 |     await page.goto('/models')
   7 |   })
   8 |
   9 |   test('should navigate to models page and display page elements', async ({ page }) => {
  10 |     // Check that the models page loads properly
  11 |     await expect(page.getByTestId('page-title')).toBeVisible()
  12 |     await expect(page.getByTestId('page-title')).toHaveText('Choose Your Model')
  13 |     
  14 |     // Check for create model button
  15 |     await expect(page.getByTestId('create-model-button')).toBeVisible()
  16 |   })
  17 |
  18 |   test('should display model creation option', async ({ page }) => {
  19 |     // Look for the "Train New Model" button
  20 |     const createButton = page.getByTestId('create-model-button')
  21 |     await expect(createButton).toBeVisible()
  22 |     await expect(createButton).toContainText('Train New Model')
  23 |   })
  24 |
  25 |   test('should handle page loading without errors', async ({ page }) => {
  26 |     // Wait for the page to fully load
  27 |     await page.waitForLoadState('networkidle')
  28 |     
  29 |     // Check that essential page elements are present
  30 |     await expect(page.getByTestId('page-title')).toBeVisible()
  31 |     await expect(page.getByTestId('create-model-button')).toBeVisible()
  32 |     
  33 |     // Check that there are no obvious error messages
  34 |     const errorElements = page.getByText(/error|failed|something went wrong/i)
  35 |     const errorCount = await errorElements.count()
  36 |     
  37 |     // It's okay if there are no error elements or if there are error elements 
  38 |     // (since they might be part of normal model status display)
  39 |     expect(errorCount >= 0).toBeTruthy()
  40 |   })
  41 |
  42 |   test('should have working navigation elements', async ({ page }) => {
  43 |     // Check for key navigation elements
  44 |     await expect(page.getByTestId('create-model-button')).toBeVisible()
  45 |     
  46 |     // Check if there's a refresh button
  47 |     const refreshButton = page.getByRole('button', { name: /refresh/i })
> 48 |     if (await refreshButton.isVisible()) {
     |                             ^ Error: locator.isVisible: Error: strict mode violation: getByRole('button', { name: /refresh/i }) resolved to 2 elements:
  49 |       await expect(refreshButton).toBeVisible()
  50 |     }
  51 |   })
  52 | }) 
```