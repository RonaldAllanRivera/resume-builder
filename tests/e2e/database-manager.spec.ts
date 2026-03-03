import { test, expect } from '@playwright/test'

test.describe('Database Manager', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/admin/login')
    await page.fill('input[name="email"]', 'dev@payloadcms.com')
    await page.fill('input[name="password"]', 'test')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
  })

  test('should display database manager on dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    
    await expect(page.locator('text=Database Management')).toBeVisible()
    await expect(page.locator('button:has-text("Reset & Seed Database")')).toBeVisible()
    await expect(page.locator('button:has-text("Reset Database")')).toBeVisible()
    await expect(page.locator('button:has-text("Seed Database")')).toBeVisible()
  })

  test('should seed database successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    
    // Click seed button
    await page.click('button:has-text("Seed Database")')
    
    // Confirm dialog
    await page.click('button:has-text("Export")')
    
    // Wait for success message
    await expect(page.locator('text=/seeded successfully/i')).toBeVisible({ timeout: 30000 })
  })

  test('should show confirmation dialog for reset', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    
    // Click reset button
    await page.click('button:has-text("Reset Database")')
    
    // Should show confirmation with warning
    await expect(page.locator('text=/DELETE ALL/i')).toBeVisible()
  })

  test('should reset and seed in one action', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    
    // Click reset & seed button
    await page.click('button:has-text("Reset & Seed Database")')
    
    // Confirm dialog
    await page.click('button:has-text("Export")')
    
    // Wait for success message
    await expect(page.locator('text=/reset and seeded successfully/i')).toBeVisible({ timeout: 60000 })
  })
})
