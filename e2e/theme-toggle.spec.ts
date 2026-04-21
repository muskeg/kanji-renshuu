import { test, expect } from '@playwright/test'

// addInitScript runs on every navigation, including reload. We only want to
// seed settings on the very first navigation, otherwise we would clobber the
// user's toggled theme when the test calls page.reload(). Guard with a
// sentinel stored in localStorage.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (localStorage.getItem('e2e-seeded') === '1') return
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
    localStorage.setItem('e2e-seeded', '1')
  })
})

test('cycling the theme toggle persists the choice across reloads', async ({ page }) => {
  await page.goto('/')

  const readTheme = () =>
    page.evaluate(() => document.documentElement.getAttribute('data-theme'))

  expect(await readTheme()).toBe('dark')

  // The header theme toggle cycles through system -> light -> dark.
  // Click up to two times so the result is deterministic regardless of the
  // host's prefers-color-scheme.
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
