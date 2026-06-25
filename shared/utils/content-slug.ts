const SUPPORTED_CONTENT_LOCALES = new Set(['en', 'de'])

/**
 * Normalizes content route params by trimming segments and removing an optional locale prefix.
 */
export function normalizeContentSlug(value: string | string[] | null | undefined): string {
  const rawSegments = Array.isArray(value) ? value : [value ?? '']

  const segments = rawSegments
    .flatMap(segment => String(segment).split('/'))
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0)

  if (segments.length > 0 && SUPPORTED_CONTENT_LOCALES.has(segments[0] ?? '')) {
    segments.shift()
  }

  return segments.join('/')
}
