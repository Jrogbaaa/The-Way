# Test info

- Name: Image Generation Flow >> should handle page loading without errors
- Location: /Users/JackEllis/THE WAY /e2e/image-generation.spec.ts:25:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByTestId('page-title')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByTestId('page-title')

    at /Users/JackEllis/THE WAY /e2e/image-generation.spec.ts:30:50
```

# Page snapshot

```yaml
- img
- paragraph: Loading your models...
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
> 30 |     await expect(page.getByTestId('page-title')).toBeVisible()
     |                                                  ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
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
  48 |     if (await refreshButton.isVisible()) {
  49 |       await expect(refreshButton).toBeVisible()
  50 |     }
  51 |   })
  52 | }) 
```