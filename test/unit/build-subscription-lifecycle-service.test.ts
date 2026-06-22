import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSubscriptionLifecycleService } from '@application/services/build-subscription-lifecycle-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { SubscriptionCancellationGateway } from '@application/interfaces/subscription-cancellation-gateway'
import {
  SubscriptionCancellationUnavailableError,
  SubscriptionNotFoundError,
  SubscriptionProviderSubscriptionIdMissingError
} from '@application/errors/subscription-errors'
import type { Subscription } from '@application/models/subscription'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildSubscriptionLifecycleService', () => {
  let repository: SubscriptionRepository
  let cancellationGateway: SubscriptionCancellationGateway

  const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
    userId: VALID_USER_ID,
    plan: 'PRO',
    status: 'ACTIVE',
    providerCustomerId: 'payrexx-customer-1',
    providerSubscriptionId: '1234',
    currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides
  })

  beforeEach(() => {
    repository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }

    cancellationGateway = {
      cancelSubscription: vi.fn()
    }
  })

  it('throws when user has no subscription', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(null)
    const service = buildSubscriptionLifecycleService(repository, cancellationGateway, makeLogger())

    await expect(service({ userId: VALID_USER_ID })).rejects.toThrow(SubscriptionNotFoundError)
    expect(cancellationGateway.cancelSubscription).not.toHaveBeenCalled()
  })

  it('throws when plan is not PRO', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ plan: 'FREE', providerSubscriptionId: null })
    )

    const service = buildSubscriptionLifecycleService(repository, cancellationGateway, makeLogger())

    await expect(service({ userId: VALID_USER_ID })).rejects.toThrow(SubscriptionCancellationUnavailableError)
    expect(cancellationGateway.cancelSubscription).not.toHaveBeenCalled()
  })

  it('returns existing subscription when already cancelled', async () => {
    const existing = makeSubscription({ status: 'CANCELLED' })
    vi.mocked(repository.findByUserId).mockResolvedValue(existing)

    const service = buildSubscriptionLifecycleService(repository, cancellationGateway, makeLogger())
    const result = await service({ userId: VALID_USER_ID })

    expect(result).toEqual(existing)
    expect(repository.update).not.toHaveBeenCalled()
    expect(cancellationGateway.cancelSubscription).not.toHaveBeenCalled()
  })

  it('throws when provider subscription id is missing', async () => {
    vi.mocked(repository.findByUserId).mockResolvedValue(
      makeSubscription({ providerSubscriptionId: null })
    )

    const service = buildSubscriptionLifecycleService(repository, cancellationGateway, makeLogger())

    await expect(service({ userId: VALID_USER_ID })).rejects.toThrow(SubscriptionProviderSubscriptionIdMissingError)
    expect(cancellationGateway.cancelSubscription).not.toHaveBeenCalled()
  })

  it('cancels at provider and updates local subscription state', async () => {
    const logger = makeLogger()
    const existing = makeSubscription({ providerSubscriptionId: '4321' })
    const updated = makeSubscription({
      plan: 'FREE',
      status: 'CANCELLED',
      providerSubscriptionId: '4321',
      currentPeriodEnd: new Date('2026-06-22T00:00:00.000Z')
    })

    vi.mocked(repository.findByUserId).mockResolvedValue(existing)
    vi.mocked(repository.update).mockResolvedValue(updated)

    const service = buildSubscriptionLifecycleService(repository, cancellationGateway, logger)
    const result = await service({ userId: VALID_USER_ID })

    expect(cancellationGateway.cancelSubscription).toHaveBeenCalledWith('4321')
    expect(repository.update).toHaveBeenCalledWith({
      ...existing,
      plan: 'FREE',
      status: 'CANCELLED',
      currentPeriodEnd: expect.any(Date)
    })
    expect(logger.info).toHaveBeenCalledWith('Subscription cancellation requested', {
      source: 'subscription-lifecycle-service',
      event: 'subscription.cancel.requested',
      userId: VALID_USER_ID,
      providerSubscriptionId: '4321'
    })
    expect(result).toEqual(updated)
  })
})
