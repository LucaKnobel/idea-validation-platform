import { describe, expect, it } from 'vitest'
import { PayrexxSubscriptionWebhookSchema } from '@infrastructure/validation/payrexx-subscription-webhook'

const makeSubscriptionPayload = (overrides: Record<string, unknown> = {}) => ({
  id: 62624,
  status: 'cancelled',
  end: '2026-06-22',
  valid_until: null,
  invoice: {
    referenceId: 'cfa260d5-5345-495c-8fa9-387ecab835cb',
    currency: 'CHF'
  },
  contact: {
    uuid: '8dff4618',
    email: 'testprosubsctiption@gmail.com'
  },
  paymentInterval: 'P1M',
  ...overrides
})

describe('PayrexxSubscriptionWebhookSchema', () => {
  it('parses direct subscription payload and strips unused fields', () => {
    const parsed = PayrexxSubscriptionWebhookSchema.parse(makeSubscriptionPayload())

    expect(parsed).toEqual({
      id: 62624,
      status: 'cancelled',
      end: '2026-06-22',
      valid_until: null,
      invoice: { referenceId: 'cfa260d5-5345-495c-8fa9-387ecab835cb' },
      contact: { uuid: '8dff4618' }
    })
    expect((parsed as Record<string, unknown>).paymentInterval).toBeUndefined()
  })

  it('parses payload wrapped in subscription envelope', () => {
    const result = PayrexxSubscriptionWebhookSchema.safeParse({
      subscription: makeSubscriptionPayload()
    })

    expect(result.success).toBe(true)
  })

  it('parses payload wrapped in transaction.subscription envelope', () => {
    const result = PayrexxSubscriptionWebhookSchema.safeParse({
      transaction: {
        subscription: makeSubscriptionPayload()
      }
    })

    expect(result.success).toBe(true)
  })

  it('rejects unknown subscription status values', () => {
    const result = PayrexxSubscriptionWebhookSchema.safeParse(
      makeSubscriptionPayload({ status: 'paused' })
    )

    expect(result.success).toBe(false)
  })

  it('rejects missing checkout referenceId', () => {
    const result = PayrexxSubscriptionWebhookSchema.safeParse(
      makeSubscriptionPayload({
        invoice: {}
      })
    )

    expect(result.success).toBe(false)
  })

  it('rejects empty contact uuid', () => {
    const result = PayrexxSubscriptionWebhookSchema.safeParse(
      makeSubscriptionPayload({
        contact: { uuid: '   ' }
      })
    )

    expect(result.success).toBe(false)
  })
})
