import { useRef, useState, useCallback, useEffect } from 'react'
import type { ReviewItem, RatingValue } from '@/core/srs/types'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './WritingPractice.module.css'

interface WritingPracticeProps {
  item: ReviewItem
  onRate: (rating: RatingValue) => void
}

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
}

export function WritingPractice({ item, onRate }: WritingPracticeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const isDrawingRef = useRef(false)
  const canvasSize = 300
  const { t } = useTranslation()

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasSize, canvasSize)

    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 0.5
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(canvasSize / 2, 0)
    ctx.lineTo(canvasSize / 2, canvasSize)
    ctx.moveTo(0, canvasSize / 2)
    ctx.lineTo(canvasSize, canvasSize / 2)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = '#e6edf3'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }

    if (currentStroke && currentStroke.length >= 2) {
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y)
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y)
      }
      ctx.stroke()
    }
  }, [strokes, currentStroke])

  useEffect(() => { redraw() }, [redraw])

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * (canvasSize / rect.width),
        y: (touch.clientY - rect.top) * (canvasSize / rect.height),
      }
    }
    return {
      x: (e.clientX - rect.left) * (canvasSize / rect.width),
      y: (e.clientY - rect.top) * (canvasSize / rect.height),
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (showAnswer) return
    e.preventDefault()
    isDrawingRef.current = true
    setCurrentStroke([getPoint(e)])
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || showAnswer) return
    e.preventDefault()
    setCurrentStroke(prev => prev ? [...prev, getPoint(e)] : [getPoint(e)])
  }

  const handleEnd = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    if (currentStroke && currentStroke.length >= 2) {
      setStrokes(prev => [...prev, { points: currentStroke }])
    }
    setCurrentStroke(null)
  }

  const handleRate = (rating: RatingValue) => {
    onRate(rating)
    setStrokes([])
    setCurrentStroke(null)
    setShowAnswer(false)
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

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {showAnswer && (
          <div className={styles.answerOverlay}>
            <span className={styles.answerKanji}>{item.kanji.literal}</span>
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <button className={styles.toolButton} onClick={() => setStrokes(prev => prev.slice(0, -1))} disabled={strokes.length === 0} type="button">{t('writing.undo')}</button>
        <button className={styles.toolButton} onClick={() => setStrokes([])} disabled={strokes.length === 0} type="button">{t('writing.clear')}</button>
        <span className={styles.strokeCount}>{t('writing.strokes', { count: strokes.length })}</span>
        <button className={styles.toolButton} onClick={() => setShowAnswer(true)} disabled={showAnswer} type="button">{showAnswer ? t('writing.shown') : t('writing.show')}</button>
      </div>

      {showAnswer && (
        <div className={styles.ratingRow}>
          <span className={styles.rateLabel}>{t('writing.howDidYouDo')}</span>
          <div className={styles.ratingButtons}>
            <button className={`${styles.rateBtn} ${styles.again}`} onClick={() => handleRate(1)} type="button">{t('rating.again')}</button>
            <button className={`${styles.rateBtn} ${styles.hard}`} onClick={() => handleRate(2)} type="button">{t('rating.hard')}</button>
            <button className={`${styles.rateBtn} ${styles.good}`} onClick={() => handleRate(3)} type="button">{t('rating.good')}</button>
            <button className={`${styles.rateBtn} ${styles.easy}`} onClick={() => handleRate(4)} type="button">{t('rating.easy')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
