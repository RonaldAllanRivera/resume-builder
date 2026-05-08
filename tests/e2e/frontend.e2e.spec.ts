import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Test Resume Builder/)

    // Rainbow Hero renders the seeded ResumeProfile fields as:
    //   - badge:  profile.headline           (e.g. "Test Developer")
    //   - h1:     profile.summary            (e.g. "Test summary for E2E tests")
    // profile.fullName lives in JSON-LD / metadata, not in the Hero copy.
    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Test summary for E2E tests')

    await expect(page.getByText('Test Developer').first()).toBeVisible()
  })
})
