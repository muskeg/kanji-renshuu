import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import type { QueueStatus } from '@/core/srs/types'
import { I18nProvider } from '@/i18n'

function renderWithI18n(status: QueueStatus, modeName?: string) {
  return render(
    <I18nProvider locale="en">
      <EmptyState status={status} onStart={() => {}} modeName={modeName} />
    </I18nProvider>,
  )
}

function baseStatus(overrides: Partial<QueueStatus>): QueueStatus {
  return {
    items: [],
    reason: 'no-cards',
    nextDueDate: null,
    newCardsToday: 0,
    newCardsLimit: 10,
    totalIntroduced: 0,
    totalKanji: 2136,
    ...overrides,
  } as QueueStatus
}

describe('EmptyState', () => {
  it('renders the "no-cards" message when there is nothing introduced yet', () => {
    renderWithI18n(baseStatus({ reason: 'no-cards' }))
    expect(screen.getByText(/no cards to study yet/i)).toBeInTheDocument()
  })

  it('renders the "daily-limit" message with progress numbers', () => {
    renderWithI18n(
      baseStatus({
        reason: 'daily-limit',
        newCardsToday: 10,
        newCardsLimit: 10,
        totalIntroduced: 25,
      }),
    )
    expect(screen.getByText(/10/)).toBeInTheDocument()
  })

  it('renders the "all-scheduled" message with the introduced count', () => {
    renderWithI18n(
      baseStatus({
        reason: 'all-scheduled',
        totalIntroduced: 42,
      }),
    )
    // Either the count or a wording about scheduled cards should be present.
    expect(document.body.textContent).toMatch(/42/)
  })

  it('renders a celebratory "all-mastered" message', () => {
    renderWithI18n(
      baseStatus({
        reason: 'all-mastered',
        totalIntroduced: 2136,
      }),
    )
    expect(screen.getByText(/🎉/)).toBeInTheDocument()
  })

  it('renders the start CTA when the queue has cards', () => {
    const onStart = vi.fn()
    render(
      <I18nProvider locale="en">
        <EmptyState
          status={baseStatus({
            reason: 'has-cards',
            // Items shape is loose here; only `cardState.introduced` is read.
            items: [
              { cardState: { introduced: true } } as never,
              { cardState: { introduced: false } } as never,
            ],
            totalIntroduced: 1,
          })}
          onStart={onStart}
          modeName="Flashcards"
        />
      </I18nProvider>,
    )
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    button.click()
    expect(onStart).toHaveBeenCalledOnce()
  })
})
