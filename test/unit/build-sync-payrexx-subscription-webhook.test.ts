import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildSubscriptionWebhookSyncService } from '@application/services/build-subscription-webhook-sync-service'
import type { SubscriptionUpsertByCheckoutInput } from '@application/interfaces/subscription-webhook-sync-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription } from '@application/models/subscription'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildSubscriptionWebhookSyncService', () => {
  let repository: SubscriptionRepository

  const makeSyncInput = (
    overrides: Partial<SubscriptionUpsertByCheckoutInput> = {}
  ): SubscriptionUpsertByCheckoutInput => ({
    userId: VALID_USER_ID,
    checkoutId: 'checkout-123',
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

  it('creates a subscription from sync input when none exists', async () => {
    const syncInput = makeSyncInput()
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
    const result = await service.upsertByCheckout(syncInput)

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

  it('updates an existing subscription from sync input', async () => {
    const syncInput = makeSyncInput({
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
    const result = await service.upsertByCheckout(syncInput)

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

  it('updates existing subscription via provider identifier fallback', async () => {
    const existing = makeSubscription({
      userId: VALID_USER_ID,
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z')
    })
    const updated = makeSubscription({
      userId: VALID_USER_ID,
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })

    vi.mocked(repository.findByProviderSubscriptionId).mockResolvedValue(existing)
    vi.mocked(repository.update).mockResolvedValue(updated)

    const service = buildSubscriptionWebhookSyncService(repository, makeLogger())
    const result = await service.upsertByProvider({
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })

    expect(repository.findByProviderSubscriptionId).toHaveBeenCalledWith('payrexx-subscription-uuid')
    expect(repository.update).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })
    expect(result).toEqual(updated)
  })
})
