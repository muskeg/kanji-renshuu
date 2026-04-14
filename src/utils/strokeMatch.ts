/**
 * Utilities for sampling points from SVG path data and comparing
 * user-drawn strokes against KanjiVG reference strokes.
 */

export interface Point {
  x: number
  y: number
}

/**
 * Sample evenly-spaced points from an SVG path string using a temporary SVGPathElement.
 * The viewBox is assumed to be 0 0 109 109 (KanjiVG standard).
 */
export function samplePathPoints(pathData: string, numSamples = 30): Point[] {
  const svgNs = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNs, 'svg')
  svg.setAttribute('viewBox', '0 0 109 109')
  const path = document.createElementNS(svgNs, 'path')
  path.setAttribute('d', pathData)
  svg.appendChild(path)
  // Must be in DOM for getPointAtLength to work
  svg.style.position = 'absolute'
  svg.style.width = '0'
  svg.style.height = '0'
  svg.style.overflow = 'hidden'
  document.body.appendChild(svg)

  const totalLen = path.getTotalLength()
  const points: Point[] = []
  for (let i = 0; i < numSamples; i++) {
    const t = numSamples > 1 ? i / (numSamples - 1) : 0
    const p = path.getPointAtLength(t * totalLen)
    points.push({ x: p.x, y: p.y })
  }

  document.body.removeChild(svg)
  return points
}

/** Euclidean distance between two points. */
function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * Compute the average nearest-neighbor distance from the user's stroke
 * to the reference stroke. Lower = better match.
 *
 * Also checks stroke direction: the start of the user stroke should be
 * near the start of the reference.
 */
export function strokeMatchScore(
  userPoints: Point[],
  refPoints: Point[],
  viewBoxSize = 109,
): { avgDistance: number; startDistance: number; directionOk: boolean } {
  if (userPoints.length < 2 || refPoints.length < 2) {
    return { avgDistance: viewBoxSize, startDistance: viewBoxSize, directionOk: false }
  }

  // Compute average nearest-neighbor distance (user → ref)
  let totalDist = 0
  for (const up of userPoints) {
    let minD = Infinity
    for (const rp of refPoints) {
      const d = dist(up, rp)
      if (d < minD) minD = d
    }
    totalDist += minD
  }
  const avgDistance = totalDist / userPoints.length

  // Check start point proximity
  const startDistance = dist(userPoints[0], refPoints[0])

  // Check direction: user end should be closer to ref end than ref start
  const userEnd = userPoints[userPoints.length - 1]
  const dToRefEnd = dist(userEnd, refPoints[refPoints.length - 1])
  const dToRefStart = dist(userEnd, refPoints[0])
  const directionOk = dToRefEnd < dToRefStart

  return { avgDistance, startDistance, directionOk }
}

/**
 * Determine if a user stroke matches a reference stroke well enough.
 * Thresholds are relative to the KanjiVG 109×109 viewBox.
 */
export function isStrokeAccepted(
  userPoints: Point[],
  refPoints: Point[],
): boolean {
  const { avgDistance, startDistance, directionOk } = strokeMatchScore(userPoints, refPoints)

  // Thresholds (in 109×109 coordinate space)
  const AVG_THRESHOLD = 18 // ~16% of viewBox
  const START_THRESHOLD = 30 // ~27% of viewBox — generous start zone

  return avgDistance < AVG_THRESHOLD && startDistance < START_THRESHOLD && directionOk
}

/**
 * Scale user-drawn points from canvas coordinates to KanjiVG 109×109 space.
 */
export function scaleToViewBox(
  points: Point[],
  canvasSize: number,
  viewBoxSize = 109,
): Point[] {
  const ratio = viewBoxSize / canvasSize
  return points.map(p => ({ x: p.x * ratio, y: p.y * ratio }))
}
