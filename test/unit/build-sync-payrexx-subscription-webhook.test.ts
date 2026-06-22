import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildSubscriptionWebhookSyncService } from '@application/services/build-subscription-webhook-sync-service'
import type { SubscriptionUpsertInput } from '@application/interfaces/subscription-webhook-sync-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription } from '@application/models/subscription'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildSubscriptionWebhookSyncService', () => {
  let repository: SubscriptionRepository

  const makeUpsertInput = (
    overrides: Partial<SubscriptionUpsertInput> = {}
  ): SubscriptionUpsertInput => ({
    userId: VALID_USER_ID,
    status: 'ACTIVE',
    providerCustomerId: 'payrexx-contact-uuid',
    providerSubscriptionId: 'payrexx-subscription-uuid',
    currentPeriodEnd: new Date('2026-12-31T00:00:00.000Z'),
    ...overrides
  })

  const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
    userId: VALID_USER_ID,
    plan: 'FREE',
    status: 'ACTIVE',
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodEnd: null,
    ...overrides
  })

  beforeEach(() => {
    repository = {
      findByUserId: vi.fn(),
      findByProviderSubscriptionId: vi.fn(),
      findByProviderCustomerId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  })

  it('creates a subscription when none exists', async () => {
    const input = makeUpsertInput()
    const created = makeSubscription({
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-12-31T00:00:00.000Z')
    })

    vi.mocked(repository.findByUserId).mockResolvedValue(null)
    vi.mocked(repository.create).mockResolvedValue(created)

    const service = buildSubscriptionWebhookSyncService(repository, makeLogger())
    const result = await service.upsert(input)

    expect(repository.findByUserId).toHaveBeenCalledWith(VALID_USER_ID)
    expect(repository.create).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-12-31T00:00:00.000Z')
    })
    expect(repository.update).not.toHaveBeenCalled()
    expect(result).toEqual(created)
  })

  it('updates an existing subscription', async () => {
    const input = makeUpsertInput({
      status: 'CANCELLED',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })
    const existing = makeSubscription()
    const updated = makeSubscription({
      plan: 'FREE',
      status: 'CANCELLED',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })

    vi.mocked(repository.findByUserId).mockResolvedValue(existing)
    vi.mocked(repository.update).mockResolvedValue(updated)

    const service = buildSubscriptionWebhookSyncService(repository, makeLogger())
    const result = await service.upsert(input)

    expect(repository.update).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      plan: 'FREE',
      status: 'CANCELLED',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })
    expect(repository.create).not.toHaveBeenCalled()
    expect(result).toEqual(updated)
  })
})
