import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSubscriptionCheckoutService } from '@application/services/build-subscription-checkout-service'
import type { SubscriptionCheckoutRepository } from '@application/interfaces/subscription-checkout-repository'
import type { SubscriptionCheckout } from '@application/models/subscription-checkout'
import {
  SubscriptionCheckoutAlreadyConsumedError,
  SubscriptionCheckoutNotFoundError
} from '@application/errors/subscription-errors'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildSubscriptionCheckoutService', () => {
  let repository: SubscriptionCheckoutRepository

  const makeCheckout = (overrides: Partial<SubscriptionCheckout> = {}): SubscriptionCheckout => ({
    id: 'checkout-001',
    userId: VALID_USER_ID,
    consumedAt: null,
    createdAt: new Date('2026-06-22T00:00:00.000Z'),
    ...overrides
  })

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      consume: vi.fn()
    }
  })

  it('creates a checkout and logs creation event', async () => {
    const checkout = makeCheckout()
    const logger = makeLogger()
    vi.mocked(repository.create).mockResolvedValue(checkout)

    const service = buildSubscriptionCheckoutService(repository, logger)
    const result = await service.createCheckout(VALID_USER_ID)

    expect(repository.create).toHaveBeenCalledWith(VALID_USER_ID)
    expect(logger.info).toHaveBeenCalledWith('Subscription checkout created', {
      source: 'subscription-checkout-service',
      event: 'subscription.checkout.created',
      checkoutId: checkout.id,
      userId: VALID_USER_ID
    })
    expect(result).toEqual(checkout)
  })

  it('throws SubscriptionCheckoutNotFoundError when checkout does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null)

    const service = buildSubscriptionCheckoutService(repository, makeLogger())

    await expect(service.consumeCheckout('missing-checkout')).rejects.toThrow(SubscriptionCheckoutNotFoundError)
    expect(repository.consume).not.toHaveBeenCalled()
  })

  it('throws SubscriptionCheckoutAlreadyConsumedError when checkout is already consumed', async () => {
    const logger = makeLogger()
    vi.mocked(repository.findById).mockResolvedValue(
      makeCheckout({ consumedAt: new Date('2026-06-22T01:00:00.000Z') })
    )

    const service = buildSubscriptionCheckoutService(repository, logger)

    await expect(service.consumeCheckout('checkout-001')).rejects.toThrow(SubscriptionCheckoutAlreadyConsumedError)
    expect(logger.warn).toHaveBeenCalledWith('Subscription checkout already consumed', {
      source: 'subscription-checkout-service',
      event: 'subscription.checkout.duplicate',
      checkoutId: 'checkout-001'
    })
    expect(repository.consume).not.toHaveBeenCalled()
  })

  it('consumes checkout and logs consumed event', async () => {
    const logger = makeLogger()
    const checkout = makeCheckout()
    const consumed = makeCheckout({ consumedAt: new Date('2026-06-22T02:00:00.000Z') })

    vi.mocked(repository.findById).mockResolvedValue(checkout)
    vi.mocked(repository.consume).mockResolvedValue(consumed)

    const service = buildSubscriptionCheckoutService(repository, logger)
    const result = await service.consumeCheckout(checkout.id)

    expect(repository.consume).toHaveBeenCalledWith(checkout.id)
    expect(logger.info).toHaveBeenCalledWith('Subscription checkout consumed', {
      source: 'subscription-checkout-service',
      event: 'subscription.checkout.consumed',
      checkoutId: checkout.id,
      userId: consumed.userId
    })
    expect(result).toEqual(consumed)
  })
})
