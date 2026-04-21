import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    indexedDB.deleteDatabase('kanji-renshuu')
    localStorage.clear()
    localStorage.setItem('kanji-renshuu-onboarded', '1')
    localStorage.setItem(
      'kanji-renshuu-settings',
      JSON.stringify({
        dailyNewCards: 10,
        dailyReviewLimit: 0,
        requestRetention: 0.9,
        maximumInterval: 365,
        defaultQuizMode: 'recognition',
        showReadingsOnFront: false,
        theme: 'dark',
        soundEnabled: false,
        language: 'en',
        uiScale: 100,
        guidedWriting: true,
      }),
    )
  })
})

test('cycling the theme toggle persists the choice across reloads', async ({ page }) => {
  await page.goto('/')

  const readTheme = () =>
    page.evaluate(() => document.documentElement.getAttribute('data-theme'))

  expect(await readTheme()).toBe('dark')

  const toggle = page.getByRole('button', { name: /theme:/i })
  await toggle.click()
  let after = await readTheme()
  if (after === 'dark') {
    await toggle.click()
    after = await readTheme()
  }

  expect(after).not.toBe('dark')

  await page.reload()
  expect(await readTheme()).toBe(after)
})
