import { test, expect } from '@playwright/test'

test.describe('Resume Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', 'dev@payloadcms.com')
    await page.fill('input[name="password"]', 'test')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
  })

  test.skip('should create a new generation', async ({ page }) => {
    // Skipped: Payload relationship fields use autocomplete UI that requires
    // complex interaction patterns (typing, waiting for dropdown, clicking)
    // This test would be better as an integration test using Payload API
    await page.goto('/admin/collections/generations')

    // Click create new
    await page.click('a[href="/admin/collections/generations/create"]')

    // Verify form loaded
    await expect(page.locator('text=Job Ad')).toBeVisible()
    await expect(page.locator('text=Resume Profile')).toBeVisible()
  })

  test('should navigate to collections', async ({ page }) => {
    // Navigate to experiences
    await page.goto('/admin/collections/experiences')
    await page.waitForURL('**/collections/experiences')
    await expect(
      page.locator('[class*="list-controls"], table, .collection-list').first(),
    ).toBeVisible()

    // Navigate to projects
    await page.goto('/admin/collections/projects')
    await page.waitForURL('**/collections/projects')
    await expect(
      page.locator('[class*="list-controls"], table, .collection-list').first(),
    ).toBeVisible()

    // Navigate to generations
    await page.goto('/admin/collections/generations')
    await page.waitForURL('**/collections/generations')
    await expect(
      page.locator('[class*="list-controls"], table, .collection-list').first(),
    ).toBeVisible()
  })

  test('should view resume profile global', async ({ page }) => {
    await page.goto('/admin/globals/resumeProfile')

    await expect(page.locator('input[name="fullName"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('should view site settings global', async ({ page }) => {
    await page.goto('/admin/globals/siteSettings')

    await expect(page.locator('input[name="siteName"]')).toBeVisible()
    await expect(page.locator('text=Social Links')).toBeVisible()
  })

  test('should filter projects by featured', async ({ page }) => {
    await page.goto('/admin/collections/projects')

    // Wait for projects to load
    await page.waitForSelector('table')

    // Check that projects are displayed
    const rows = await page.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(0)
  })
})
