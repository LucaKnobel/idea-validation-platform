import { setHeader, createError, getRequestIP, type H3Event } from 'h3'
import { rateLimitStore } from '@infrastructure/rate-limit/rate-limit-store'
import { logger } from '@infrastructure/logging/logger'

type RateLimitScope = 'ip' | 'user' | 'user-or-ip'

export interface EnforceRateLimitOptions {
  name: string
  maxRequests: number
  windowSeconds: number
  scope?: RateLimitScope
}

/**
 * Extract client IP from request headers.
 * Returns null if IP cannot be determined.
 */
const getClientIP = (event: H3Event): string | null => {
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (!ip) {
    logger.warn('Could not determine client IP', { path: event.path, method: event.method })
    return null
  }
  return ip
}

/**
 * Extract authenticated user ID from event context.
 */
const getUserId = (event: H3Event): string | undefined => {
  return (event.context as { userId?: string }).userId
}

/**
 * Resolve rate limit subject based on scope and context.
 * Throws 500 if 'user' scope requires auth but user is missing.
 * Throws 403 if IP cannot be determined for 'ip' scope.
 */
const resolveSubject = (scope: RateLimitScope, userId: string | undefined, ip: string | null): string => {
  if (scope === 'user') {
    if (!userId) {
      throw createError({ statusCode: 500, statusMessage: 'Rate limit requires authenticated user' })
    }
    return `user:${userId}`
  }

  if (scope === 'user-or-ip') {
    if (userId) return `user:${userId}`
    if (!ip) throw createError({ statusCode: 403, statusMessage: 'Cannot determine client identity' })
    return `ip:${ip}`
  }

  // scope === 'ip'
  if (!ip) throw createError({ statusCode: 403, statusMessage: 'Cannot determine client IP' })
  return `ip:${ip}`
}

/**
 * Set rate limit response headers.
 */
const setResponseHeaders = (
  event: H3Event,
  maxRequests: number,
  windowSeconds: number,
  remaining: number,
  retryAfterSeconds: number
): void => {
  // RFC-compatible rate limit headers
  setHeader(event, 'RateLimit-Policy', `${maxRequests};w=${windowSeconds}`)
  setHeader(event, 'RateLimit-Limit', String(maxRequests))
  setHeader(event, 'RateLimit-Remaining', String(remaining))
  setHeader(event, 'RateLimit-Reset', String(retryAfterSeconds))
}

/**
 * Enforce rate limiting for an API endpoint.
 *
 * @example
 * await enforceRateLimit(event, {
 *   name: 'content.read',
 *   maxRequests: 100,
 *   windowSeconds: 60,
 *   scope: 'ip'
 * })
 */
export const enforceRateLimit = async (
  event: H3Event,
  options: EnforceRateLimitOptions
): Promise<void> => {
  const { name, maxRequests, windowSeconds } = options
  const scope = options.scope ?? 'ip'

  try {
    const ip = getClientIP(event)
    const userId = getUserId(event)
    const subject = resolveSubject(scope, userId, ip)
    const method = event.method || 'GET'
    const key = `${name}:${method}:${subject}`

    const result = await rateLimitStore.consume(key, maxRequests, windowSeconds)
    setResponseHeaders(event, maxRequests, windowSeconds, result.remaining, result.retryAfterSeconds)

    if (!result.allowed) {
      setHeader(event, 'Retry-After', result.retryAfterSeconds)

      logger.warn('Rate limit exceeded', {
        source: 'rate-limit',
        endpoint: name,
        scope,
        subject,
        remaining: result.remaining
      })

      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
    }
  } catch (error) {
    // Re-throw HTTP errors
    if (error instanceof Error && 'statusCode' in error) throw error

    // Log unexpected errors
    logger.error('Rate limit error', { endpoint: options.name }, error)
  }
}
