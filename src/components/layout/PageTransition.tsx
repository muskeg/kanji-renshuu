import type { ReactNode } from 'react'
import styles from './PageTransition.module.css'

interface PageTransitionProps {
  viewKey: string
  children: ReactNode
}

export function PageTransition({ viewKey, children }: PageTransitionProps) {
  return (
    <div key={viewKey} className={styles.wrapper}>
      {children}
    </div>
  )
}
