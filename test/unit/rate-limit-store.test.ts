import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  loggerError: vi.fn()
}))

vi.mock('@infrastructure/db/prisma', () => ({
  prisma: {
    $transaction: testState.transaction
  }
}))

vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    error: testState.loggerError
  }
}))

const buildTx = () => ({
  rateLimit: {
    findUnique: testState.findUnique,
    upsert: testState.upsert,
    update: testState.update
  }
})

describe('PostgresRateLimitStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows first request for a new key', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    testState.findUnique.mockResolvedValue(null)
    testState.upsert.mockResolvedValue(undefined)
    testState.transaction.mockImplementation(async (handler: (tx: ReturnType<typeof buildTx>) => Promise<unknown>) => handler(buildTx()))

    const { PostgresRateLimitStore } = await import('../../server/infrastructure/rate-limit/rate-limit-store')
    const store = new PostgresRateLimitStore()

    const result = await store.consume('content.read:GET:ip:203.0.113.10', 5, 60)

    expect(result).toEqual({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0
    })
    expect(testState.upsert).toHaveBeenCalledOnce()
  })

  it('increments existing counter within active window', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    testState.findUnique.mockResolvedValue({
      key: 'content.read:GET:ip:203.0.113.10',
      count: 1,
      lastRequest: BigInt(now - 2_000)
    })
    testState.update.mockResolvedValue({
      count: 2,
      lastRequest: BigInt(now)
    })
    testState.transaction.mockImplementation(async (handler: (tx: ReturnType<typeof buildTx>) => Promise<unknown>) => handler(buildTx()))

    const { PostgresRateLimitStore } = await import('../../server/infrastructure/rate-limit/rate-limit-store')
    const store = new PostgresRateLimitStore()

    const result = await store.consume('content.read:GET:ip:203.0.113.10', 5, 60)

    expect(result).toEqual({
      allowed: true,
      remaining: 3,
      retryAfterSeconds: 0
    })
    expect(testState.update).toHaveBeenCalledOnce()
  })

  it('blocks when request count exceeds max and returns retry-after', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    testState.findUnique.mockResolvedValue({
      key: 'content.read:GET:ip:203.0.113.10',
      count: 2,
      lastRequest: BigInt(now - 5_000)
    })
    testState.update.mockResolvedValue({
      count: 3,
      lastRequest: BigInt(now)
    })
    testState.transaction.mockImplementation(async (handler: (tx: ReturnType<typeof buildTx>) => Promise<unknown>) => handler(buildTx()))

    const { PostgresRateLimitStore } = await import('../../server/infrastructure/rate-limit/rate-limit-store')
    const store = new PostgresRateLimitStore()

    const result = await store.consume('content.read:GET:ip:203.0.113.10', 2, 60)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })

  it('fails open when database transaction throws', async () => {
    testState.transaction.mockRejectedValue(new Error('db offline'))

    const { PostgresRateLimitStore } = await import('../../server/infrastructure/rate-limit/rate-limit-store')
    const store = new PostgresRateLimitStore()

    const result = await store.consume('content.read:GET:ip:203.0.113.10', 5, 60)

    expect(result).toEqual({
      allowed: true,
      remaining: 5,
      retryAfterSeconds: 0
    })
    expect(testState.loggerError).toHaveBeenCalledOnce()
  })
})
