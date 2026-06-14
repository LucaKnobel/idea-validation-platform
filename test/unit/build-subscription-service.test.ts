import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSubscriptionService } from '@application/services/build-subscription-service'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription } from '@application/models/subscription'
import type { Logger } from '@interfaces/logger'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildSubscriptionService', () => {
  let repository: SubscriptionRepository
  let logger: Logger
  let service: ReturnType<typeof buildSubscriptionService>

  const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
    userId: VALID_USER_ID,
    plan: 'FREE',
    status: 'ACTIVE',
    providerReference: null,
    currentPeriodEnd: null,
    ...overrides
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-14T12:00:00.000Z'))

    repository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
    logger = makeLogger()
    service = buildSubscriptionService(repository, logger)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('getByUserId forwards to repository', async () => {
    const subscription = makeSubscription()
    vi.mocked(repository.findByUserId).mockResolvedValue(subscription)

    const result = await service.getByUserId(VALID_USER_ID)

    expect(repository.findByUserId).toHaveBeenCalledWith(VALID_USER_ID)
    expect(result).toEqual(subscription)
  })

  it('isPro returns false when no subscription exists', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(null)

    await expect(service.isPro(VALID_USER_ID)).resolves.toBe(false)
  })

  it('isPro returns true for active PRO subscriptions', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'PRO', status: 'ACTIVE' })
    )

    await expect(service.isPro(VALID_USER_ID)).resolves.toBe(true)
  })

  it('isPro returns true for cancelled PRO subscriptions still in paid period', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({
        plan: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
      })
    )

    await expect(service.isPro(VALID_USER_ID)).resolves.toBe(true)
  })

  it('isPro returns false for cancelled PRO subscriptions with expired period', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({
        plan: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z')
      })
    )

    await expect(service.isPro(VALID_USER_ID)).resolves.toBe(false)
  })

  it('isPro returns false for free subscriptions', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'FREE', status: 'ACTIVE' })
    )

    await expect(service.isPro(VALID_USER_ID)).resolves.toBe(false)
  })

  it('getBusinessIdeaLimit returns 1 for free users', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'FREE', status: 'ACTIVE' })
    )

    await expect(service.getBusinessIdeaLimit(VALID_USER_ID)).resolves.toBe(1)
  })

  it('getBusinessIdeaLimit returns Infinity for pro users', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'PRO', status: 'ACTIVE' })
    )

    await expect(service.getBusinessIdeaLimit(VALID_USER_ID)).resolves.toBe(Number.POSITIVE_INFINITY)
  })

  it('createFreeSubscription returns existing subscription without creating one', async () => {
    const existing = makeSubscription({ plan: 'PRO', status: 'ACTIVE' })
    vi.mocked(repository.findByUserId).mockResolvedValue(existing)

    const result = await service.createFreeSubscription(VALID_USER_ID)

    expect(result).toEqual(existing)
    expect(repository.create).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('createFreeSubscription creates and logs a new free subscription when none exists', async () => {
    const created = makeSubscription({ plan: 'FREE', status: 'ACTIVE' })
    vi.mocked(repository.findByUserId).mockResolvedValue(null)
    vi.mocked(repository.create).mockResolvedValue(created)

    const result = await service.createFreeSubscription(VALID_USER_ID)

    expect(repository.create).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      plan: 'FREE',
      status: 'ACTIVE',
      providerReference: null,
      currentPeriodEnd: null
    })
    expect(logger.info).toHaveBeenCalledWith('Free subscription created', {
      source: 'subscription-service',
      event: 'subscription.free_created',
      userId: VALID_USER_ID
    })
    expect(result).toEqual(created)
  })

  it('assertCanCreateBusinessIdea throws when free user reaches limit and logs warning', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'FREE', status: 'ACTIVE' })
    )

    await expect(service.assertCanCreateBusinessIdea(VALID_USER_ID, 1)).rejects.toThrow(
      SubscriptionLimitExceededError
    )

    expect(logger.warn).toHaveBeenCalledWith('Business idea limit exceeded', {
      source: 'subscription-service',
      event: 'subscription.limit_exceeded',
      userId: VALID_USER_ID,
      currentIdeas: 1,
      limit: 1
    })
  })

  it('assertCanCreateBusinessIdea allows creation when free user is below limit', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'FREE', status: 'ACTIVE' })
    )

    await expect(service.assertCanCreateBusinessIdea(VALID_USER_ID, 0)).resolves.toBeUndefined()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('assertCanCreateBusinessIdea allows creation for pro users regardless of idea count', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'PRO', status: 'ACTIVE' })
    )

    await expect(service.assertCanCreateBusinessIdea(VALID_USER_ID, 999)).resolves.toBeUndefined()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
