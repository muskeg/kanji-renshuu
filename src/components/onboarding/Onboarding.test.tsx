import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Onboarding } from './Onboarding'
import { I18nProvider } from '@/i18n'
import { loadSettings } from '@/core/storage/settings'
import { isOnboarded } from '@/core/storage/onboarding'

function renderOnboarding(onComplete = vi.fn()) {
  render(
    <I18nProvider locale="en">
      <Onboarding onComplete={onComplete} />
    </I18nProvider>,
  )
  return onComplete
}

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows step 1 (welcome) on first render', () => {
    renderOnboarding()
    expect(screen.getByText(/Master all 2,136/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('advances to the pace step and writes dailyNewCards on finish', () => {
    const onComplete = renderOnboarding()

    fireEvent.click(screen.getByRole('button', { name: /get started/i }))
    expect(screen.getByText(/choose your pace/i)).toBeInTheDocument()

    // Pick the "20 per day" pace.
    fireEvent.click(screen.getByText(/20 per day/i))
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))

    // Step 3 — interact with the demo card.
    fireEvent.click(screen.getByText(/^一$/))
    // Click any rating in the demo.
    fireEvent.click(screen.getByRole('button', { name: /good/i }))

    fireEvent.click(screen.getByRole('button', { name: /start learning/i }))

    expect(onComplete).toHaveBeenCalledOnce()
    expect(loadSettings().dailyNewCards).toBe(20)
    expect(isOnboarded()).toBe(true)
  })

  it('exposes a Skip button on every step that completes onboarding without overwriting settings', () => {
    const before = loadSettings().dailyNewCards
    const onComplete = renderOnboarding()

    fireEvent.click(screen.getByRole('button', { name: /skip/i }))

    expect(onComplete).toHaveBeenCalledOnce()
    expect(isOnboarded()).toBe(true)
    expect(loadSettings().dailyNewCards).toBe(before)
  })
})
