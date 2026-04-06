/** Sanitize a string by removing HTML tags and trimming */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 200) // Limit length
}
