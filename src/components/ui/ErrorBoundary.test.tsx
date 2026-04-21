import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('kaboom')
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // React logs error boundary errors via console.error; silence the noise.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>safe content</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/kaboom/)).toBeInTheDocument()
  })

  it('exposes Reload, Export and Reset actions in the fallback', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset all data/i })).toBeInTheDocument()
  })

  it('uses a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={(err, reset) => (
        <div>
          <span>custom: {err.message}</span>
          <button onClick={reset}>retry</button>
        </div>
      )}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/custom: kaboom/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
  })
})
