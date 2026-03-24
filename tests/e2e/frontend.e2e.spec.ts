import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Test Resume Builder/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Test User')
  })
})
