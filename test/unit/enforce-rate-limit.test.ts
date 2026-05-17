import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  getRequestIP: vi.fn(),
  setHeader: vi.fn(),
  consume: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn()
}))

vi.mock('h3', () => ({
  getRequestIP: testState.getRequestIP,
  setHeader: testState.setHeader,
  createError: ({ statusCode, statusMessage }: { statusCode: number, statusMessage: string }) => {
    const error = new Error(statusMessage) as Error & { statusCode: number }
    error.statusCode = statusCode
    return error
  }
}))

vi.mock('@infrastructure/rate-limit/rate-limit-store', () => ({
  rateLimitStore: {
    consume: testState.consume
  }
}))

vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    warn: testState.loggerWarn,
    error: testState.loggerError
  }
}))

type TestEvent = {
  method: string
  path: string
  context: { userId?: string }
}

const createEvent = (overrides?: Partial<TestEvent>): TestEvent => ({
  method: 'GET',
  path: '/api/content/legal/privacy',
  context: {},
  ...overrides
})

describe('enforceRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets standard rate limit headers for allowed ip-scoped request', async () => {
    testState.getRequestIP.mockReturnValue('203.0.113.11')
    testState.consume.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0
    })

    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')
    const event = createEvent()

    await enforceRateLimit(event as never, {
      name: 'content.read',
      maxRequests: 10,
      windowSeconds: 60,
      scope: 'ip'
    })

    expect(testState.consume).toHaveBeenCalledWith('content.read:GET:ip:203.0.113.11', 10, 60)
    expect(testState.setHeader).toHaveBeenCalledWith(event, 'RateLimit-Policy', '10;w=60')
    expect(testState.setHeader).toHaveBeenCalledWith(event, 'RateLimit-Limit', '10')
    expect(testState.setHeader).toHaveBeenCalledWith(event, 'RateLimit-Remaining', '9')
    expect(testState.setHeader).toHaveBeenCalledWith(event, 'RateLimit-Reset', '0')
  })

  it('throws 429 and sets Retry-After when limit is exceeded', async () => {
    testState.getRequestIP.mockReturnValue('203.0.113.12')
    testState.consume.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 12
    })

    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')
    const event = createEvent()

    await expect(
      enforceRateLimit(event as never, {
        name: 'content.read',
        maxRequests: 10,
        windowSeconds: 60,
        scope: 'ip'
      })
    ).rejects.toMatchObject({ statusCode: 429 })

    expect(testState.setHeader).toHaveBeenCalledWith(event, 'Retry-After', 12)
    expect(testState.loggerWarn).toHaveBeenCalledWith(
      'Rate limit exceeded',
      expect.objectContaining({ endpoint: 'content.read', remaining: 0 })
    )
  })

  it('uses user subject for user-or-ip scope when user exists', async () => {
    testState.getRequestIP.mockReturnValue('203.0.113.13')
    testState.consume.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0
    })

    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')
    const event = createEvent({ context: { userId: 'user-123' } })

    await enforceRateLimit(event as never, {
      name: 'ideas.create',
      maxRequests: 5,
      windowSeconds: 60,
      scope: 'user-or-ip'
    })

    expect(testState.consume).toHaveBeenCalledWith('ideas.create:GET:user:user-123', 5, 60)
  })

  it('throws 500 for user scope without authenticated user', async () => {
    testState.getRequestIP.mockReturnValue('203.0.113.14')

    const { enforceRateLimit } = await import('@server/infrastructure/rate-limit/enforce-rate-limit')
    const event = createEvent({ context: {} })

    await expect(
      enforceRateLimit(event as never, {
        name: 'ideas.create',
        maxRequests: 5,
        windowSeconds: 60,
        scope: 'user'
      })
    ).rejects.toMatchObject({ statusCode: 500 })
  })
})
