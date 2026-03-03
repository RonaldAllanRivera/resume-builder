import { test, expect } from '@playwright/test'

test.describe('Admin Login Flow', () => {
  test('should login as admin successfully', async ({ page }) => {
    await page.goto('/admin/login')

    // Fill in login form
    await page.fill('input[name="email"]', 'dev@payloadcms.com')
    await page.fill('input[name="password"]', 'test')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin')

    // Verify we're logged in
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login')

    await page.fill('input[name="email"]', 'invalid@test.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Should show error message (Payload shows various error formats)
    await expect(page.locator('.render-fields__error, [class*="error"], .error')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', 'dev@payloadcms.com')
    await page.fill('input[name="password"]', 'test')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')

    // Logout
    await page.click('[aria-label="Account"]')
    await page.click('text=Logout')

    // Should redirect to login
    await page.waitForURL('**/admin/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})
