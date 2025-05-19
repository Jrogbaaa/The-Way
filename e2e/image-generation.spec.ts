import { test, expect } from '@playwright/test'

test.describe('Image Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page before each test
    await page.goto('/')
  })

  test('should show error when no model is selected', async ({ page }) => {
    // Click the generate button without selecting a model
    await page.click('button:has-text("Generate")')
    
    // Check for error message
    const errorMessage = await page.getByRole('alert')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Please select a model')
  })

  test('should successfully generate an image', async ({ page }) => {
    // Select a model
    await page.selectOption('select[name="model"]', { label: 'Default Model' })
    
    // Enter a prompt
    await page.fill('textarea[name="prompt"]', 'A beautiful sunset over mountains')
    
    // Click generate
    await page.click('button:has-text("Generate")')
    
    // Wait for the loading state
    await expect(page.getByRole('progressbar')).toBeVisible()
    
    // Wait for the result
    const resultImage = page.getByRole('img').filter({ hasText: 'Generated Image' })
    await expect(resultImage).toBeVisible({ timeout: 30000 })
  })

  test('should handle model validation errors', async ({ page }) => {
    // Select an invalid model
    await page.selectOption('select[name="model"]', { label: 'Invalid Model' })
    
    // Enter a prompt
    await page.fill('textarea[name="prompt"]', 'Test prompt')
    
    // Click generate
    await page.click('button:has-text("Generate")')
    
    // Check for validation error
    const errorMessage = await page.getByRole('alert')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Invalid or corrupted model')
  })
}) 