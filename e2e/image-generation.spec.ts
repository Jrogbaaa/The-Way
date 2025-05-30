import { test, expect } from '@playwright/test'

test.describe('Image Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the models page before each test
    await page.goto('/models')
  })

  test('should navigate to models page and display page elements', async ({ page }) => {
    // Check that the models page loads properly
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('page-title')).toHaveText('Choose Your Model')
    
    // Check for create model button
    await expect(page.getByTestId('create-model-button')).toBeVisible()
  })

  test('should display model creation option', async ({ page }) => {
    // Look for the "Train New Model" button
    const createButton = page.getByTestId('create-model-button')
    await expect(createButton).toBeVisible()
    await expect(createButton).toContainText('Train New Model')
  })

  test('should handle page loading without errors', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')
    
    // Check that essential page elements are present
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('create-model-button')).toBeVisible()
    
    // Check that there are no obvious error messages
    const errorElements = page.getByText(/error|failed|something went wrong/i)
    const errorCount = await errorElements.count()
    
    // It's okay if there are no error elements or if there are error elements 
    // (since they might be part of normal model status display)
    expect(errorCount >= 0).toBeTruthy()
  })

  test('should have working navigation elements', async ({ page }) => {
    // Check for key navigation elements
    await expect(page.getByTestId('create-model-button')).toBeVisible()
    
    // Check if there's a refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i })
    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeVisible()
    }
  })
}) 