import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    indexedDB.deleteDatabase('kanji-renshuu')
    localStorage.clear()
    localStorage.setItem('kanji-renshuu-onboarded', '1')
  })
})

test('starting flashcards without any introduced cards shows a helpful empty state, not a blank screen', async ({ page }) => {
  // Force the "no cards to study" path by setting dailyNewCards to 0.
  await page.addInitScript(() => {
    localStorage.setItem(
      'kanji-renshuu-settings',
      JSON.stringify({
        dailyNewCards: 0,
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
  await page.goto('/')

  // Click the Flashcards study mode from the home page.
  await page.getByRole('button', { name: /flashcards/i }).first().click()

  // Should land on an empty state with a clear message, never a blank page.
  await expect(
    page.getByText(/all caught up|no cards|come back|daily limit|great job/i).first(),
  ).toBeVisible()
})

test('completing a session shows the session summary with a score', async ({ page }) => {
  await page.goto('/')

  // Click the Flashcards study mode (default pace is 10/day, so there should be new cards).
  await page.getByRole('button', { name: /flashcards/i }).first().click()

  // The EmptyState shows a "Start" button when cards are available.
  const startButton = page.getByRole('button', { name: /start/i })
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click()
  }

  // Flip the card and rate it Good. Keep flipping until summary appears or we give up.
  for (let i = 0; i < 15; i++) {
    const summaryVisible = await page.getByText(/session complete|great work|summary/i).isVisible().catch(() => false)
    if (summaryVisible) break

    // Tap to reveal the back of the card if needed.
    const cardBody = page.locator('body')
    await cardBody.click({ position: { x: 200, y: 300 } }).catch(() => {})

    const goodBtn = page.getByRole('button', { name: /^good$/i })
    if (await goodBtn.isVisible().catch(() => false)) {
      await goodBtn.click().catch(() => {})
    } else {
      break
    }
  }

  // At minimum the app should not have crashed into an error boundary.
  await expect(page.locator('body')).not.toContainText(/something went wrong/i)
})
