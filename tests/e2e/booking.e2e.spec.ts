import { test, expect, type Page } from '@playwright/test'

// BookingFlow (src/templates/rainbow/components/BookingFlow.tsx) is a
// client-rendered wizard with no <form> element — every step advances via
// plain onClick buttons, not form submission. There is no
// `button[type="submit"]` anywhere in the DOM, so selectors must target the
// actual step buttons by role/name instead.
//
// The calendar only lets you click a date; only after a date is picked does
// it fetch real slots from `/api/availability/slots`, which depends on the
// seeded `packages` + `availabilityRules` data. This suite requires that
// seed to exist (see `src/endpoints/seed-booking.ts` / `pnpm seed:complete`)
// — without it, the "no availability" message renders instead of slots and
// these tests will fail past the first one, by design (no assertion here is
// weakened to paper over missing seed data).

/**
 * Drive the booking wizard from `/services` through to the "confirm" step
 * (package + date + time + contact details filled in), stopping short of
 * actually submitting. Shared by the two tests that need to reach that step.
 */
async function navigateToConfirmStep(page: Page) {
  await page.goto('/services')

  const firstBookLink = page.locator('a[href^="/book/"]').first()
  await firstBookLink.click()
  await expect(page).toHaveURL(/\/book\//)

  // Step 1: Date. Calendar day buttons render as a bare day-of-month number
  // (e.g. "14"); everything else on the page (nav arrows, the step
  // indicator) has a different accessible name, so this regex isolates them.
  // Not every rendered day is bookable (advance-notice window), so try each
  // enabled one in order until the click lands.
  const dateButtons = page.getByRole('button', { name: /^\d{1,2}$/ })
  await expect(dateButtons.first()).toBeVisible({ timeout: 15_000 })

  const dateCount = await dateButtons.count()
  let pickedDate = false
  for (let i = 0; i < dateCount; i++) {
    const candidate = dateButtons.nth(i)
    if (await candidate.isEnabled()) {
      await candidate.click()
      pickedDate = true
      break
    }
  }
  expect(pickedDate).toBe(true)

  // Step 2: Time. Slots load async from the availability API; slot buttons
  // render a formatted clock time like "6:00 PM", which is a distinct shape
  // from the date buttons above.
  await expect(page.getByRole('heading', { name: /select a time/i })).toBeVisible()
  const slotButtons = page.getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)/i })
  await expect(slotButtons.first()).toBeVisible({ timeout: 15_000 })
  await slotButtons.first().click()

  // Step 3: Details.
  await expect(page.getByRole('heading', { name: /your details/i })).toBeVisible()
  await page.getByLabel(/full name/i).fill('Jane Dev')
  await page.getByLabel(/^email/i).fill(`jane-e2e-${Date.now()}@example.com`)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4: Confirm.
  await expect(page.getByRole('heading', { name: /confirm your booking/i })).toBeVisible()
}

test.describe('booking flow', () => {
  test('services page lists bookable packages', async ({ page }) => {
    await page.goto('/services')
    const bookLinks = page.locator('a[href^="/book/"]')
    await expect(bookLinks.first()).toBeVisible()
  })

  test('submitting a request shows the inline confirmation', async ({ page }) => {
    await navigateToConfirmStep(page)

    await page.getByRole('button', { name: /submit booking request/i }).click()

    await expect(page.getByText(/Booking Request Submitted/i)).toBeVisible({ timeout: 15_000 })
  })

  test('renders the payment terms summary on the booking form confirmation step', async ({
    page,
  }) => {
    // Carried forward from the Task 7 review: the conditional render of
    // `paymentTermsSummary` was only ever proven via typecheck. Prove it in
    // a real browser here. `BookingSettings.paymentTermsSummary` defaults to
    // "Payment is by invoice after I review and accept your request." (see
    // src/BookingSettings/config.ts) and is rendered on the confirm step by
    // src/templates/rainbow/components/BookingFlow.tsx — assert that exact
    // default text, since this test does not overwrite the global.
    await navigateToConfirmStep(page)

    await expect(page.getByText(/payment is by invoice/i)).toBeVisible()
  })
})
