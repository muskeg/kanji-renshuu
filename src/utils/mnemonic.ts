/**
 * Render a tiny safe markdown subset to HTML-escaped string with limited tags.
 * Supports: **bold**, *italic*, `code`, line breaks. Everything else is escaped.
 * Used for user-authored mnemonics — never trust raw input.
 */
export function renderMnemonic(input: string): string {
  if (!input) return ''
  // 1. HTML-escape everything first.
  const esc = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  // 2. Apply markdown-ish replacements on the escaped string.
  return esc
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />')
}
