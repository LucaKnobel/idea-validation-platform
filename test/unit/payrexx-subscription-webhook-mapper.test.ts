import { describe, expect, it } from 'vitest'
import { mapPayrexxWebhookToUpsertInput } from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import type { PayrexxSubscriptionWebhook } from '@infrastructure/validation/payrexx-subscription-webhook'

const USER_ID = 'user-001'

const makeWebhook = (
  overrides: Partial<PayrexxSubscriptionWebhook> = {}
): PayrexxSubscriptionWebhook => ({
  id: 62624,
  status: 'active',
  end: '2026-06-22',
  valid_until: null,
  invoice: {
    referenceId: 'cfa260d5-5345-495c-8fa9-387ecab835cb'
  },
  contact: {
    uuid: '8dff4618'
  },
  ...overrides
})

describe('mapPayrexxWebhookToUpsertInput', () => {
  it('maps ACTIVE status and provider identifiers correctly', () => {
    const result = mapPayrexxWebhookToUpsertInput(makeWebhook(), USER_ID)

    expect(result).toMatchObject({
      userId: USER_ID,
      status: 'ACTIVE',
      providerCustomerId: '8dff4618',
      providerSubscriptionId: '62624'
    })
    expect(result.currentPeriodEnd?.toISOString()).toBe('2026-06-22T00:00:00.000Z')
  })

  it('maps cancelled status to CANCELLED', () => {
    const result = mapPayrexxWebhookToUpsertInput(
      makeWebhook({ status: 'cancelled' }),
      USER_ID
    )

    expect(result.status).toBe('CANCELLED')
  })

  it('uses valid_until when end is null', () => {
    const result = mapPayrexxWebhookToUpsertInput(
      makeWebhook({ end: null, valid_until: '2026-07-01' }),
      USER_ID
    )

    expect(result.currentPeriodEnd?.toISOString()).toBe('2026-07-01T00:00:00.000Z')
  })

  it('returns null currentPeriodEnd for invalid dates', () => {
    const result = mapPayrexxWebhookToUpsertInput(
      makeWebhook({ end: 'not-a-date' }),
      USER_ID
    )

    expect(result.currentPeriodEnd).toBeNull()
  })
})
