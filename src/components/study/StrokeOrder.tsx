import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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

export function StrokeOrder({ svgData, size = 200 }: StrokeOrderProps) {
  const strokes = useMemo(() => parseStrokes(svgData), [svgData])
  const [visibleStrokes, setVisibleStrokes] = useState(strokes.length)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsPlaying(false)
    setVisibleStrokes(0)
  }, [])

  const stepForward = useCallback(() => {
    setVisibleStrokes(prev => Math.min(prev + 1, strokes.length))
  }, [strokes.length])

  const play = useCallback(() => {
    setIsPlaying(true)
    setVisibleStrokes(0)
  }, [])

  // Auto-advance during playback
  useEffect(() => {
    if (!isPlaying) return

    if (visibleStrokes >= strokes.length) {
      setIsPlaying(false)
      return
    }

    timerRef.current = setTimeout(() => {
      setVisibleStrokes(prev => prev + 1)
    }, 600)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, visibleStrokes, strokes.length])

  // Reset visible strokes when svg data changes
  useEffect(() => {
    setVisibleStrokes(strokes.length)
    setIsPlaying(false)
  }, [strokes.length])

  if (strokes.length === 0) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderText}>
          Stroke order data not available
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
          title="Reset"
          type="button"
          aria-label="Reset stroke order"
        >
          ⏮
        </button>
        <button
          className={styles.controlButton}
          onClick={isPlaying ? () => setIsPlaying(false) : play}
          title={isPlaying ? 'Pause' : 'Play'}
          type="button"
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className={styles.controlButton}
          onClick={stepForward}
          disabled={visibleStrokes >= strokes.length}
          title="Next stroke"
          type="button"
          aria-label="Next stroke"
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
