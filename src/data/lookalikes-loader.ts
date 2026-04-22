import lookalikesData from './lookalikes.json'

const lookalikes = lookalikesData as Record<string, string[]>

/**
 * Returns up to `max` literals visually similar to `literal`. Order is the
 * pre-computed similarity rank (most similar first). Empty if none known.
 */
export function getLookalikes(literal: string, max = 5): string[] {
  const entries = lookalikes[literal]
  if (!entries) return []
  return entries.slice(0, max)
}
