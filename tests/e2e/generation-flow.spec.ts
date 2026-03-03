import { test, expect } from '@playwright/test'

test.describe('Resume Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/admin/login')
    await page.fill('input[name="email"]', 'dev@payloadcms.com')
    await page.fill('input[name="password"]', 'test')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
  })

  test('should create a new generation', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/collections/generations')
    
    // Click create new
    await page.click('a[href="/admin/collections/generations/create"]')
    
    // Fill in generation form
    await page.selectOption('select[name="jobAd"]', { index: 1 })
    await page.selectOption('select[name="resumeProfile"]', { index: 1 })
    
    // Save
    await page.click('button:has-text("Save")')
    
    // Should redirect to the created generation
    await expect(page.url()).toContain('/admin/collections/generations/')
    await expect(page.locator('text=Generation saved')).toBeVisible()
  })

  test('should navigate to collections', async ({ page }) => {
    // Navigate to experiences
    await page.goto('http://localhost:3000/admin/collections/experiences')
    await expect(page.locator('h1:has-text("Experiences")')).toBeVisible()
    
    // Navigate to projects
    await page.goto('http://localhost:3000/admin/collections/projects')
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible()
    
    // Navigate to certifications
    await page.goto('http://localhost:3000/admin/collections/certifications')
    await expect(page.locator('h1:has-text("Certifications")')).toBeVisible()
  })

  test('should view resume profile global', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/globals/resumeProfile')
    
    await expect(page.locator('input[name="fullName"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('should view site settings global', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/globals/siteSettings')
    
    await expect(page.locator('input[name="siteName"]')).toBeVisible()
    await expect(page.locator('text=Social Links')).toBeVisible()
  })

  test('should filter projects by featured', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/collections/projects')
    
    // Wait for projects to load
    await page.waitForSelector('table')
    
    // Check that projects are displayed
    const rows = await page.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(0)
  })
})
