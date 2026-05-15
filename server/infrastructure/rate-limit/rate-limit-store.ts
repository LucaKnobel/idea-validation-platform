import { prisma } from '@infrastructure/db/prisma'
import { logger } from '@infrastructure/logging/logger'
import type { RateLimitStore, RateLimitResult } from '@interfaces/rate-limit-store'

/**
 * Postgres-backed rate limit store.
 * Implements sliding window counter with atomic transactions.
 */
export class PostgresRateLimitStore implements RateLimitStore {
  async consume(key: string, maxRequests: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000

    try {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.rateLimit.findUnique({ where: { key } })

        // Window expired or entry doesn't exist: reset counter
        if (!existing || Number(existing.lastRequest) < windowStart) {
          await tx.rateLimit.upsert({
            where: { key },
            create: {
              id: crypto.randomUUID(),
              key,
              count: 1,
              lastRequest: BigInt(now)
            },
            update: {
              count: 1,
              lastRequest: BigInt(now)
            }
          })

          return { count: 1, lastRequestTime: now }
        }

        // Within window: increment counter
        const updated = await tx.rateLimit.update({
          where: { key },
          data: {
            count: { increment: 1 },
            lastRequest: BigInt(now)
          }
        })

        return { count: updated.count, lastRequestTime: Number(existing.lastRequest) }
      })

      const allowed = result.count <= maxRequests
      const remaining = Math.max(0, maxRequests - result.count)
      const retryAfterSeconds = allowed
        ? 0
        : Math.max(1, Math.ceil((result.lastRequestTime + windowSeconds * 1000 - now) / 1000))

      return { allowed, remaining, retryAfterSeconds }
    } catch (error) {
      logger.error('Rate limit store error', { key }, error)
      // Fail open: allow if store fails
      return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 }
    }
  }
}

export const rateLimitStore = new PostgresRateLimitStore()
