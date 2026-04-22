/**
 * Tiny dependency-free confetti burst. Spawns a burst of coloured div pieces
 * inside a container, each with its own physics-y CSS animation. Cleans up
 * after the longest animation completes.
 *
 * Honours `prefers-reduced-motion` by becoming a no-op.
 */

interface ConfettiOptions {
  pieceCount?: number
  durationMs?: number
  colors?: string[]
  origin?: { x: number; y: number }
}

const DEFAULT_COLORS = ['#f43f5e', '#f97316', '#fbbf24', '#4ade80', '#38bdf8', '#a855f7']

export function fireConfetti(options: ConfettiOptions = {}): void {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const {
    pieceCount = 80,
    durationMs = 1800,
    colors = DEFAULT_COLORS,
    origin = { x: window.innerWidth / 2, y: window.innerHeight / 3 },
  } = options

  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    'z-index:9999',
    'overflow:hidden',
  ].join(';')
  document.body.appendChild(root)

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div')
    const angle = Math.random() * Math.PI * 2
    const velocity = 200 + Math.random() * 300
    const dx = Math.cos(angle) * velocity
    const dy = Math.sin(angle) * velocity - 200 // bias upward
    const rotation = (Math.random() - 0.5) * 720
    const size = 6 + Math.random() * 6
    const color = colors[Math.floor(Math.random() * colors.length)]
    const delay = Math.random() * 80

    piece.style.cssText = [
      'position:absolute',
      `left:${origin.x}px`,
      `top:${origin.y}px`,
      `width:${size}px`,
      `height:${size * 0.6}px`,
      `background:${color}`,
      'border-radius:1px',
      `transform:translate(-50%,-50%)`,
      `animation:confetti-fly ${durationMs}ms cubic-bezier(0.2, 0.8, 0.4, 1) ${delay}ms forwards`,
      `--dx:${dx}px`,
      `--dy:${dy}px`,
      `--rot:${rotation}deg`,
    ].join(';')
    root.appendChild(piece)
  }

  // Inject the keyframe stylesheet once per page lifetime.
  if (!document.getElementById('confetti-keyframes')) {
    const style = document.createElement('style')
    style.id = 'confetti-keyframes'
    style.textContent = `@keyframes confetti-fly {
      0%   { opacity: 1; transform: translate(-50%, -50%) rotate(0); }
      100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 600px)) rotate(var(--rot)); }
    }`
    document.head.appendChild(style)
  }

  window.setTimeout(() => {
    root.remove()
  }, durationMs + 200)
}
