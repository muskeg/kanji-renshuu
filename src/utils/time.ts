/** Format a future date as a human-readable relative duration */
export function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMs = date.getTime() - now

  if (diffMs <= 0) return 'now'

  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(diffMs / 3_600_000)
  const days = Math.floor(diffMs / 86_400_000)

  if (minutes < 1) return 'less than a minute'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) {
    const remainMin = minutes - hours * 60
    return remainMin > 0 ? `${hours}h ${remainMin}m` : `${hours}h`
  }
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
