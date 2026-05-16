/**
 * Rate limit consumption result.
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Abstract rate limit store interface.
 * Implementations can use Postgres, Redis, in-memory, or other backends.
 */
export interface RateLimitStore {
  /**
   * Consume a rate limit bucket.
   * @param key - Unique identifier (e.g., "content:GET:ip:192.0.2.1")
   * @param maxRequests - Maximum requests allowed in window
   * @param windowSeconds - Time window in seconds
   */
  consume(key: string, maxRequests: number, windowSeconds: number): Promise<RateLimitResult>
}
