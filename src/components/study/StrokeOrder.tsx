import { useCallback, useMemo, useReducer, useRef, useEffect } from 'react'
import { useTranslation } from '@/i18n'
import styles from './StrokeOrder.module.css'

interface StrokeOrderProps {
  svgData: string
  size?: number
}

/** Parse SVG path data into individual stroke paths */
function parseStrokes(svgData: string): string[] {
  if (!svgData) return []

  // Try to extract <path d="..."> elements if it's full SVG markup
  const pathRegex = /d="([^"]+)"/g
  const paths: string[] = []
  let match: RegExpExecArray | null

  while ((match = pathRegex.exec(svgData)) !== null) {
    paths.push(match[1])
  }

  // If no <path> elements found, treat the string as a single path
  if (paths.length === 0 && svgData.trim()) {
    paths.push(svgData.trim())
  }

  return paths
}

interface StrokeState {
  visibleStrokes: number
  isPlaying: boolean
}

type StrokeAction =
  | { type: 'play' }
  | { type: 'reset' }
  | { type: 'step' }
  | { type: 'advance'; total: number }
  | { type: 'init'; total: number }

function strokeReducer(state: StrokeState, action: StrokeAction): StrokeState {
  switch (action.type) {
    case 'play':
      return { visibleStrokes: 0, isPlaying: true }
    case 'reset':
      return { visibleStrokes: 0, isPlaying: false }
    case 'step':
      return { ...state, visibleStrokes: state.visibleStrokes + 1 }
    case 'advance':
      if (state.visibleStrokes >= action.total) {
        return { ...state, isPlaying: false }
      }
      return { ...state, visibleStrokes: state.visibleStrokes + 1 }
    case 'init':
      return { visibleStrokes: action.total, isPlaying: false }
  }
}

export function StrokeOrder({ svgData, size = 200 }: StrokeOrderProps) {
  const strokes = useMemo(() => parseStrokes(svgData), [svgData])
  const [state, dispatch] = useReducer(strokeReducer, { visibleStrokes: strokes.length, isPlaying: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { t } = useTranslation()

  const { visibleStrokes, isPlaying } = state

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    dispatch({ type: 'reset' })
  }, [])

  const stepForward = useCallback(() => {
    dispatch({ type: 'step' })
  }, [])

  const play = useCallback(() => {
    dispatch({ type: 'play' })
  }, [])

  // Auto-advance during playback — setState is inside a timer callback (async), not synchronous
  useEffect(() => {
    if (!isPlaying || visibleStrokes >= strokes.length) return

    timerRef.current = setTimeout(() => {
      dispatch({ type: 'advance', total: strokes.length })
    }, 600)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPlaying, visibleStrokes, strokes.length])

  if (strokes.length === 0) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderText}>
          {t('strokeOrder.notAvailable')}
        </span>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <svg
        className={styles.svg}
        viewBox="0 0 109 109"
        width={size}
        height={size}
      >
        {/* Guide grid */}
        <line x1="54.5" y1="0" x2="54.5" y2="109" className={styles.guide} />
        <line x1="0" y1="54.5" x2="109" y2="54.5" className={styles.guide} />

        {/* Completed strokes (gray) */}
        {strokes.slice(0, visibleStrokes).map((d, i) => (
          <path
            key={`done-${i}`}
            d={d}
            className={i === visibleStrokes - 1 && isPlaying ? styles.strokeAnimating : styles.strokeDone}
            fill="none"
          />
        ))}

        {/* Remaining strokes (dimmed) */}
        {strokes.slice(visibleStrokes).map((d, i) => (
          <path
            key={`remaining-${i}`}
            d={d}
            className={styles.strokeRemaining}
            fill="none"
          />
        ))}
      </svg>

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={reset}
          title={t('strokeOrder.reset')}
          type="button"
          aria-label={t('strokeOrder.resetAria')}
        >
          ⏮
        </button>
        <button
          className={styles.controlButton}
          onClick={isPlaying ? reset : play}
          title={isPlaying ? t('strokeOrder.pause') : t('strokeOrder.play')}
          type="button"
          aria-label={isPlaying ? t('strokeOrder.pauseAria') : t('strokeOrder.playAria')}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className={styles.controlButton}
          onClick={stepForward}
          disabled={visibleStrokes >= strokes.length}
          title={t('strokeOrder.nextStroke')}
          type="button"
          aria-label={t('strokeOrder.nextAria')}
        >
          ⏭
        </button>
        <span className={styles.counter}>
          {visibleStrokes} / {strokes.length}
        </span>
      </div>
    </div>
  )
}
