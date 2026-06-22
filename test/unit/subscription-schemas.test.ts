import { describe, expect, it } from 'vitest'
import {
  CancelSubscriptionResponseSchema,
  SubscriptionCheckoutUrlResponseSchema,
  SubscriptionStatusResponseSchema
} from '@infrastructure/validation/subscription-schemas'

describe('subscription schemas', () => {
  describe('CancelSubscriptionResponseSchema', () => {
    it('accepts a valid response payload', () => {
      const result = CancelSubscriptionResponseSchema.safeParse({
        status: 'CANCELLED',
        currentPeriodEnd: '2026-06-22T00:00:00.000Z'
      })

      expect(result.success).toBe(true)
    })

    it('rejects invalid status values', () => {
      const result = CancelSubscriptionResponseSchema.safeParse({
        status: 'UNKNOWN',
        currentPeriodEnd: null
      })

      expect(result.success).toBe(false)
    })

    it('rejects invalid datetime values', () => {
      const result = CancelSubscriptionResponseSchema.safeParse({
        status: 'ACTIVE',
        currentPeriodEnd: '2026-06-22'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('SubscriptionStatusResponseSchema', () => {
    it('accepts nullable plan and status for users without subscription', () => {
      const result = SubscriptionStatusResponseSchema.safeParse({
        plan: null,
        status: null,
        currentPeriodEnd: null,
        isPro: false
      })

      expect(result.success).toBe(true)
    })

    it('accepts valid PRO payload', () => {
      const result = SubscriptionStatusResponseSchema.safeParse({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: '2026-07-01T00:00:00.000Z',
        isPro: true
      })

      expect(result.success).toBe(true)
    })

    it('rejects non-boolean isPro values', () => {
      const result = SubscriptionStatusResponseSchema.safeParse({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: null,
        isPro: 'true'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('SubscriptionCheckoutUrlResponseSchema', () => {
    it('accepts a valid checkout URL', () => {
      const result = SubscriptionCheckoutUrlResponseSchema.safeParse({
        checkoutUrl: 'https://example.payrexx.com/pay?referenceId=abc'
      })

      expect(result.success).toBe(true)
    })

    it('rejects malformed URLs', () => {
      const result = SubscriptionCheckoutUrlResponseSchema.safeParse({
        checkoutUrl: 'not-a-url'
      })

      expect(result.success).toBe(false)
    })
  })
})
