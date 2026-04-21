import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  /** Optional override for the fallback UI. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * App-root error boundary. Catches render-phase errors anywhere in the tree,
 * shows a friendly fallback with self-service actions (reload, export data,
 * reset cards), and logs the error to the console for debugging.
 *
 * Promise rejections and event-handler errors do NOT propagate to error
 * boundaries — those should be handled where they originate.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to the console so the user (or a developer) can inspect.
    // We deliberately keep this minimal — no third-party telemetry.
    console.error('[ErrorBoundary] uncaught render error:', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  private handleExport = async (): Promise<void> => {
    try {
      // Lazy-load so the boundary itself never depends on storage code that
      // might be the source of the crash.
      const { exportData, downloadJson } = await import('@/core/storage/export')
      const json = await exportData()
      const date = new Date().toISOString().split('T')[0]
      downloadJson(json, `kanji-renshuu-backup-${date}.json`)
    } catch (err) {
      console.error('[ErrorBoundary] export failed:', err)
      alert('Could not export data. See console for details.')
    }
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  private handleReset = async (): Promise<void> => {
    const ok = window.confirm(
      'This will permanently delete all your progress. Are you sure?',
    )
    if (!ok) return
    try {
      const { deleteDB } = await import('idb')
      await deleteDB('kanji-renshuu')
      window.localStorage.clear()
      window.location.reload()
    } catch (err) {
      console.error('[ErrorBoundary] reset failed:', err)
      alert('Could not reset. See console for details.')
    }
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset)
    }

    return (
      <div className={styles.container} role="alert">
        <div className={styles.card}>
          <div className={styles.icon} aria-hidden>
            ⚠️
          </div>
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.body}>
            The app hit an unexpected error. Your saved progress is still on
            this device. You can try one of the actions below.
          </p>
          <pre className={styles.error}>{error.message}</pre>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={this.handleReload}>
              Reload
            </button>
            <button className={styles.secondary} onClick={this.handleExport}>
              Export my data
            </button>
            <button className={styles.danger} onClick={this.handleReset}>
              Reset all data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
