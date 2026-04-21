import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    indexedDB.deleteDatabase('kanji-renshuu')
    localStorage.clear()
    localStorage.setItem('kanji-renshuu-onboarded', '1')
  })
})

test('exporting produces a JSON file with the expected shape', async ({ page }) => {
  await page.goto('/')

  // Navigate to Settings -> Data tab.
  await page.getByRole('button', { name: /^settings$/i }).click()
  await page.getByRole('button', { name: /^data$/i }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /export data/i }).click()
  const download = await downloadPromise

  // Read the contents and validate the envelope.
  const path = await download.path()
  expect(path).toBeTruthy()
  const fs = await import('node:fs/promises')
  const raw = await fs.readFile(path!, 'utf-8')
  const parsed = JSON.parse(raw)
  expect(parsed.version).toBe(1)
  expect(Array.isArray(parsed.cards)).toBe(true)
  expect(Array.isArray(parsed.dailyStats)).toBe(true)
  expect(typeof parsed.settings).toBe('object')
})
