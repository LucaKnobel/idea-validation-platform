import { randomInt } from 'node:crypto'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'

const testState = vi.hoisted(() => ({
  counts: new Map<string, number>()
}))

vi.mock('@infrastructure/rate-limit/rate-limit-store', () => ({
  rateLimitStore: {
    consume: vi.fn(async (key: string, maxRequests: number) => {
      const currentCount = (testState.counts.get(key) ?? 0) + 1
      testState.counts.set(key, currentCount)

      const allowed = currentCount <= maxRequests

      return {
        allowed,
        remaining: Math.max(0, maxRequests - currentCount),
        retryAfterSeconds: allowed ? 0 : 30
      }
    })
  }
}))

const buildIp = (): string => `203.0.113.${randomInt(1, 250)}`

beforeAll(() => {
  registerEndpoint('/api/test/rate-limit', async (event) => {
    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')

    await enforceRateLimit(event, {
      name: 'integration.rate_limit',
      maxRequests: 3,
      windowSeconds: 60,
      scope: 'ip'
    })

    return { ok: true }
  })

  registerEndpoint('/api/test/rate-limit-user-or-ip', async (event) => {
    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')

    const rawUserId = event.node.req.headers['x-test-user-id']
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId

    if (typeof userId === 'string' && userId.length > 0) {
      ;(event.context as { userId?: string }).userId = userId
    }

    await enforceRateLimit(event, {
      name: 'integration.rate_limit_user_or_ip',
      maxRequests: 2,
      windowSeconds: 60,
      scope: 'user-or-ip'
    })

    return { ok: true }
  })

  registerEndpoint('/api/test/rate-limit-user-only', async (event) => {
    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')

    const rawUserId = event.node.req.headers['x-test-user-id']
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId

    if (typeof userId === 'string' && userId.length > 0) {
      ;(event.context as { userId?: string }).userId = userId
    }

    await enforceRateLimit(event, {
      name: 'integration.rate_limit_user_only',
      maxRequests: 2,
      windowSeconds: 60,
      scope: 'user'
    })

    return { ok: true }
  })
})

beforeEach(() => {
  testState.counts.clear()
})

const hitRateLimitEndpoint = (ip: string) => {
  return $fetch.raw('/api/test/rate-limit', {
    headers: {
      'x-forwarded-for': ip
    },
    ignoreResponseError: true
  })
}

const hitUserOrIpRateLimitEndpoint = (ip: string, userId?: string) => {
  return $fetch.raw('/api/test/rate-limit-user-or-ip', {
    headers: {
      'x-forwarded-for': ip,
      ...(userId ? { 'x-test-user-id': userId } : {})
    },
    ignoreResponseError: true
  })
}

const hitUserOnlyRateLimitEndpoint = (ip: string, userId?: string) => {
  return $fetch.raw('/api/test/rate-limit-user-only', {
    headers: {
      'x-forwarded-for': ip,
      ...(userId ? { 'x-test-user-id': userId } : {})
    },
    ignoreResponseError: true
  })
}

describe('Rate limit runtime behavior', () => {
  it('returns standard rate limit headers for allowed requests', async () => {
    const response = await hitRateLimitEndpoint(buildIp())

    expect(response.status).toBe(200)
    expect(response.headers.get('ratelimit-policy')).toBe('3;w=60')
    expect(response.headers.get('ratelimit-limit')).toBe('3')
    expect(response.headers.get('ratelimit-remaining')).toBe('2')
    expect(response.headers.get('ratelimit-reset')).toBe('0')
  })

  it('blocks repeated requests for same subject with 429 and Retry-After', async () => {
    const ip = buildIp()

    await hitRateLimitEndpoint(ip)
    await hitRateLimitEndpoint(ip)
    await hitRateLimitEndpoint(ip)
    const blockedResponse = await hitRateLimitEndpoint(ip)

    expect(blockedResponse.status).toBe(429)
    expect(blockedResponse.headers.get('retry-after')).toBeTruthy()
    expect(blockedResponse.headers.get('ratelimit-remaining')).toBe('0')
  })

  it('falls back to ip scope when no session exists for user-or-ip', async () => {
    const ip = buildIp()

    await hitUserOrIpRateLimitEndpoint(ip)
    await hitUserOrIpRateLimitEndpoint(ip)
    const blockedResponse = await hitUserOrIpRateLimitEndpoint(ip)

    expect(blockedResponse.status).toBe(429)
    expect(blockedResponse.headers.get('ratelimit-limit')).toBe('2')
  })

  it('uses user scope when session exists for user-or-ip', async () => {
    const ip = buildIp()

    await hitUserOrIpRateLimitEndpoint(ip, 'user-a')
    await hitUserOrIpRateLimitEndpoint(ip, 'user-a')

    const blockedUserA = await hitUserOrIpRateLimitEndpoint(ip, 'user-a')
    const allowedUserB = await hitUserOrIpRateLimitEndpoint(ip, 'user-b')

    expect(blockedUserA.status).toBe(429)
    expect(allowedUserB.status).toBe(200)
  })

  it('returns 500 for user-only scope when session is missing', async () => {
    const response = await hitUserOnlyRateLimitEndpoint(buildIp())

    expect(response.status).toBe(500)
  })
})
