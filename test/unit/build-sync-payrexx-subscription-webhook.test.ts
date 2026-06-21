import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildSyncPayrexxSubscriptionWebhook } from '@application/services/build-sync-payrexx-subscription-webhook'
import type { SyncSubscriptionInput } from '@application/services/build-sync-payrexx-subscription-webhook'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription } from '@application/models/subscription'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildSyncPayrexxSubscriptionWebhook', () => {
  let repository: SubscriptionRepository

  const makeSyncInput = (
    overrides: Partial<SyncSubscriptionInput> = {}
  ): SyncSubscriptionInput => ({
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

    const syncWebhook = buildSyncPayrexxSubscriptionWebhook(repository, makeLogger())
    const result = await syncWebhook(syncInput)

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
      plan: 'PRO',
      status: 'CANCELLED',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })

    vi.mocked(repository.findByUserId).mockResolvedValue(existing)
    vi.mocked(repository.update).mockResolvedValue(updated)

    const syncWebhook = buildSyncPayrexxSubscriptionWebhook(repository, makeLogger())
    const result = await syncWebhook(syncInput)

    expect(repository.update).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      plan: 'PRO',
      status: 'CANCELLED',
      providerCustomerId: 'payrexx-contact-uuid',
      providerSubscriptionId: 'payrexx-subscription-uuid',
      currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z')
    })
    expect(repository.create).not.toHaveBeenCalled()
    expect(result).toEqual(updated)
  })
})
