import type { ToastData } from '@/hooks/useToast'
import styles from './Toast.module.css'

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={styles.toast}>
          <span className={styles.icon}>{toast.icon}</span>
          <div className={styles.content}>
            <div className={styles.title}>{toast.title}</div>
            <div className={styles.body}>{toast.body}</div>
          </div>
          <button
            className={styles.close}
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
