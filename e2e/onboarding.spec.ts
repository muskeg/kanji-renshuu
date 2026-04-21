import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Start every test with a clean slate: no IndexedDB, no localStorage.
  await context.clearCookies()
  await context.addInitScript(() => {
    indexedDB.deleteDatabase('kanji-renshuu')
    localStorage.clear()
  })
})

test('first-time user sees the onboarding welcome step', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Master all 2,136/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible()
})

test('completing onboarding saves the chosen pace and unlocks home', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /get started/i }).click()

  await expect(page.getByText(/choose your pace/i)).toBeVisible()
  await page.getByText(/20 per day/i).click()
  await page.getByRole('button', { name: /^continue$/i }).click()

  // Step 3: demo card
  await page.getByText('一').first().click()
  await page.getByRole('button', { name: /good/i }).click()
  await page.getByRole('button', { name: /start learning/i }).click()

  // Onboarding is gone — we are now in the review view.
  await expect(page.getByText(/choose your pace/i)).not.toBeVisible()

  const pace = await page.evaluate(() => {
    const raw = localStorage.getItem('kanji-renshuu-settings')
    if (!raw) return null
    return (JSON.parse(raw) as { dailyNewCards: number }).dailyNewCards
  })
  expect(pace).toBe(20)

  const flag = await page.evaluate(() => localStorage.getItem('kanji-renshuu-onboarded'))
  expect(flag).toBeTruthy()
})

test('the Skip link completes onboarding without changing settings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^skip$/i }).click()
  await expect(page.getByText(/Master all 2,136/i)).not.toBeVisible()
  const flag = await page.evaluate(() => localStorage.getItem('kanji-renshuu-onboarded'))
  expect(flag).toBeTruthy()
})
