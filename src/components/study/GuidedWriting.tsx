import { useRef, useState, useCallback, useMemo } from 'react'
import type { ReviewItem, RatingValue } from '@/core/srs/types'
import { samplePathPoints, isStrokeAccepted, scaleToViewBox } from '@/utils/strokeMatch'
import type { Point } from '@/utils/strokeMatch'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './GuidedWriting.module.css'

interface GuidedWritingProps {
  item: ReviewItem
  onRate: (rating: RatingValue) => void
  onToggleMode: () => void
}

/** Parse SVG path data strings from a KanjiVG SVG string */
function parseStrokes(svgData: string): string[] {
  if (!svgData) return []
  const pathRegex = /d="([^"]+)"/g
  const paths: string[] = []
  let match: RegExpExecArray | null
  while ((match = pathRegex.exec(svgData)) !== null) {
    paths.push(match[1])
  }
  if (paths.length === 0 && svgData.trim()) {
    paths.push(svgData.trim())
  }
  return paths
}

const CANVAS_SIZE = 300
const VIEWBOX_SIZE = 109

export function GuidedWriting({ item, onRate, onToggleMode }: GuidedWritingProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isDrawingRef = useRef(false)
  const currentPointsRef = useRef<Point[]>([])

  const strokes = useMemo(() => parseStrokes(item.kanji.strokeOrderSvg), [item.kanji.strokeOrderSvg])

  // Pre-sample reference points for each stroke
  const refPointsPerStroke = useMemo(
    () => strokes.map(d => samplePathPoints(d, 30)),
    [strokes],
  )

  const [completedCount, setCompletedCount] = useState(0)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const [snappingIndex, setSnappingIndex] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const { t } = useTranslation()

  const isComplete = completedCount >= strokes.length && strokes.length > 0

  const getPoint = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: (clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (clientY - rect.top) * (CANVAS_SIZE / rect.height),
    }
  }, [])

  const handleStart = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (isComplete) return
    e.preventDefault()
    isDrawingRef.current = true
    const pt = getPoint(e)
    currentPointsRef.current = [pt]
    setCurrentPath(`M${pt.x},${pt.y}`)
  }, [isComplete, getPoint])

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current || isComplete) return
    e.preventDefault()
    const pt = getPoint(e)
    currentPointsRef.current.push(pt)
    setCurrentPath(prev => prev ? `${prev} L${pt.x},${pt.y}` : `M${pt.x},${pt.y}`)
  }, [isComplete, getPoint])

  const handleEnd = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const userPoints = currentPointsRef.current
    if (userPoints.length < 2 || completedCount >= strokes.length) {
      setCurrentPath(null)
      currentPointsRef.current = []
      return
    }

    // Scale user points from canvas coords to viewBox coords
    const scaledPoints = scaleToViewBox(userPoints, CANVAS_SIZE, VIEWBOX_SIZE)
    const refPoints = refPointsPerStroke[completedCount]

    if (isStrokeAccepted(scaledPoints, refPoints)) {
      // Accepted! Snap to the reference stroke with animation
      setSnappingIndex(completedCount)
      setCurrentPath(null)
      currentPointsRef.current = []
      setCompletedCount(prev => prev + 1)
      // Clear snap animation after it plays
      setTimeout(() => setSnappingIndex(null), 400)
    } else {
      // Rejected — flash error and clear
      setMistakes(prev => prev + 1)
      setShowError(true)
      setCurrentPath(null)
      currentPointsRef.current = []
      setTimeout(() => setShowError(false), 400)
    }
  }, [completedCount, strokes.length, refPointsPerStroke])

  const handleUndo = useCallback(() => {
    if (completedCount > 0) {
      setCompletedCount(prev => prev - 1)
    }
  }, [completedCount])

  const handleReset = useCallback(() => {
    setCompletedCount(0)
    setCurrentPath(null)
    currentPointsRef.current = []
    setMistakes(0)
    setSnappingIndex(null)
  }, [])

  const handleRate = useCallback((rating: RatingValue) => {
    onRate(rating)
  }, [onRate])

  // Auto-suggest rating based on mistakes
  const suggestedRating = useMemo((): RatingValue => {
    if (mistakes === 0) return 4 // easy
    if (mistakes <= 2) return 3 // good
    if (mistakes <= 5) return 2 // hard
    return 1 // again
  }, [mistakes])

  if (strokes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.prompt}>
          <span className={styles.readings}>
            {item.kanji.readings.onYomi.join('\u3001')}
            {item.kanji.readings.onYomi.length > 0 && item.kanji.readings.kunYomi.length > 0 && '\u30FB'}
            {item.kanji.readings.kunYomi.join('\u3001')}
          </span>
          <span className={styles.meaning}>{getMeanings(item.kanji).slice(0, 3).join(', ')}</span>
        </div>
        <p>{t('strokeOrder.notAvailable')}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.prompt}>
        <span className={styles.readings}>
          {item.kanji.readings.onYomi.join('\u3001')}
          {item.kanji.readings.onYomi.length > 0 && item.kanji.readings.kunYomi.length > 0 && '\u30FB'}
          {item.kanji.readings.kunYomi.join('\u3001')}
        </span>
        <span className={styles.meaning}>{getMeanings(item.kanji).slice(0, 3).join(', ')}</span>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          ref={svgRef}
          className={styles.drawingSvg}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {/* Guide grid */}
          <line x1={CANVAS_SIZE / 2} y1="0" x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} className={styles.guide} />
          <line x1="0" y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} className={styles.guide} />

          {/* All strokes as faint ghosts for reference */}
          <g transform={`scale(${CANVAS_SIZE / VIEWBOX_SIZE})`}>
            {strokes.slice(0, completedCount).map((d, i) => (
              <path
                key={`completed-${i}`}
                d={d}
                className={snappingIndex === i ? styles.strokeSnapIn : styles.strokeCompleted}
                fill="none"
              />
            ))}
          </g>

          {/* User's current drawing (in canvas coordinates) */}
          {currentPath && (
            <path
              d={currentPath}
              className={styles.strokeCurrent}
              fill="none"
            />
          )}
        </svg>

        {showError && <div className={styles.errorFlash} />}
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.toolButton}
          onClick={handleUndo}
          disabled={completedCount === 0 || isComplete}
          type="button"
        >
          {t('writing.undo')}
        </button>
        <button
          className={styles.toolButton}
          onClick={handleReset}
          disabled={completedCount === 0}
          type="button"
        >
          {t('writing.clear')}
        </button>
        <span className={styles.strokeCount}>
          {completedCount} / {strokes.length}
        </span>
        <button
          className={styles.modeToggle}
          onClick={onToggleMode}
          type="button"
        >
          {t('writing.freeMode')}
        </button>
      </div>

      {isComplete && (
        <div className={styles.ratingRow}>
          <span className={styles.rateLabel}>
            {mistakes === 0
              ? t('writing.perfectStrokes')
              : t('writing.mistakesCount', { count: mistakes })}
          </span>
          <div className={styles.ratingButtons}>
            <button
              className={`${styles.rateBtn} ${styles.again} ${suggestedRating === 1 ? styles.suggested : ''}`}
              onClick={() => handleRate(1)}
              type="button"
            >
              {t('rating.again')}
            </button>
            <button
              className={`${styles.rateBtn} ${styles.hard} ${suggestedRating === 2 ? styles.suggested : ''}`}
              onClick={() => handleRate(2)}
              type="button"
            >
              {t('rating.hard')}
            </button>
            <button
              className={`${styles.rateBtn} ${styles.good} ${suggestedRating === 3 ? styles.suggested : ''}`}
              onClick={() => handleRate(3)}
              type="button"
            >
              {t('rating.good')}
            </button>
            <button
              className={`${styles.rateBtn} ${styles.easy} ${suggestedRating === 4 ? styles.suggested : ''}`}
              onClick={() => handleRate(4)}
              type="button"
            >
              {t('rating.easy')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
