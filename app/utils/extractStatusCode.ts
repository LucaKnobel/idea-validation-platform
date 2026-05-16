/**
 * Extracts an HTTP status code from common error object shapes returned by browser and auth clients.
 */
export const extractStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const maybeError = error as {
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
    error?: { statusCode?: unknown, status?: unknown }
  }

  const candidates = [
    maybeError.statusCode,
    maybeError.status,
    maybeError.response?.status,
    maybeError.error?.statusCode,
    maybeError.error?.status
  ]

  for (const value of candidates) {
    if (typeof value === 'number') {
      return value
    }
  }

  return undefined
}
