import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SubscriptionCheckoutService } from '@application/interfaces/subscription-checkout-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import {
  SubscriptionWebhookActiveCheckoutReferenceMissingError,
  SubscriptionCheckoutNotFoundError,
  SubscriptionCheckoutAlreadyConsumedError
} from '@application/errors/subscription-errors'
import { buildResolveSubscriptionWebhookUserId } from '@application/services/build-resolve-subscription-webhook-user-id'
import type { Subscription } from '@application/models/subscription'
import { makeLogger, VALID_USER_ID } from './helpers'

describe('buildResolveSubscriptionWebhookUserId', () => {
  let checkoutService: SubscriptionCheckoutService
  let subscriptionRepository: SubscriptionRepository

  const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
    userId: VALID_USER_ID,
    plan: 'PRO',
    status: 'ACTIVE',
    providerCustomerId: 'provider-customer-1',
    providerSubscriptionId: 'provider-subscription-1',
    currentPeriodEnd: null,
    ...overrides
  })

  beforeEach(() => {
    checkoutService = {
      createCheckout: vi.fn(),
      consumeCheckout: vi.fn()
    }

    subscriptionRepository = {
      findByUserId: vi.fn(),
      findByProviderSubscriptionId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  })

  describe('active webhook', () => {
    it('throws when checkout reference id is missing', async () => {
      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'active',
        checkoutReferenceId: null,
        providerSubscriptionId: 'sub-1'
      })).rejects.toThrow(SubscriptionWebhookActiveCheckoutReferenceMissingError)
    })

    it('returns userId from checkout when successfully consumed', async () => {
      vi.mocked(checkoutService.consumeCheckout).mockResolvedValue({
        id: 'checkout-1',
        userId: VALID_USER_ID,
        consumedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z')
      })

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'active',
        checkoutReferenceId: 'checkout-1',
        providerSubscriptionId: 'sub-1'
      })).resolves.toBe(VALID_USER_ID)

      expect(checkoutService.consumeCheckout).toHaveBeenCalledWith('checkout-1')
      expect(subscriptionRepository.findByProviderSubscriptionId).not.toHaveBeenCalled()
    })

    it('falls back to provider lookup when checkout not found', async () => {
      vi.mocked(checkoutService.consumeCheckout).mockRejectedValue(new SubscriptionCheckoutNotFoundError())
      vi.mocked(subscriptionRepository.findByProviderSubscriptionId).mockResolvedValue(
        makeSubscription({ userId: 'fallback-user', providerSubscriptionId: 'sub-2' })
      )

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'active',
        checkoutReferenceId: 'checkout-2',
        providerSubscriptionId: 'sub-2'
      })).resolves.toBe('fallback-user')

      expect(subscriptionRepository.findByProviderSubscriptionId).toHaveBeenCalledWith('sub-2')
    })

    it('falls back to provider lookup when checkout already consumed (duplicate webhook)', async () => {
      vi.mocked(checkoutService.consumeCheckout).mockRejectedValue(new SubscriptionCheckoutAlreadyConsumedError())
      vi.mocked(subscriptionRepository.findByProviderSubscriptionId).mockResolvedValue(
        makeSubscription({ userId: 'duplicate-user', providerSubscriptionId: 'sub-3' })
      )

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'active',
        checkoutReferenceId: 'checkout-3',
        providerSubscriptionId: 'sub-3'
      })).resolves.toBe('duplicate-user')
    })

    it('re-throws unexpected errors from consumeCheckout', async () => {
      const unexpectedError = new Error('database connection lost')
      vi.mocked(checkoutService.consumeCheckout).mockRejectedValue(unexpectedError)

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'active',
        checkoutReferenceId: 'checkout-4',
        providerSubscriptionId: 'sub-4'
      })).rejects.toThrow(unexpectedError)

      expect(subscriptionRepository.findByProviderSubscriptionId).not.toHaveBeenCalled()
    })

    it('returns null when checkout not found and provider lookup has no match', async () => {
      vi.mocked(checkoutService.consumeCheckout).mockRejectedValue(new SubscriptionCheckoutNotFoundError())
      vi.mocked(subscriptionRepository.findByProviderSubscriptionId).mockResolvedValue(null)

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'active',
        checkoutReferenceId: 'checkout-5',
        providerSubscriptionId: 'sub-5'
      })).resolves.toBeNull()
    })
  })

  describe('non-active webhook', () => {
    it('resolves userId directly by provider subscription id', async () => {
      vi.mocked(subscriptionRepository.findByProviderSubscriptionId).mockResolvedValue(
        makeSubscription({ userId: 'non-active-user', providerSubscriptionId: 'sub-6' })
      )

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'cancelled',
        checkoutReferenceId: null,
        providerSubscriptionId: 'sub-6'
      })).resolves.toBe('non-active-user')

      expect(checkoutService.consumeCheckout).not.toHaveBeenCalled()
    })

    it('returns null when no subscription found for provider id', async () => {
      vi.mocked(subscriptionRepository.findByProviderSubscriptionId).mockResolvedValue(null)

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: 'failed',
        checkoutReferenceId: null,
        providerSubscriptionId: 'missing-sub'
      })).resolves.toBeNull()
    })

    it.each(['overdue', 'failed', 'cancelled', 'in_notice'] as const)('handles %s status via provider lookup', async (status) => {
      vi.mocked(subscriptionRepository.findByProviderSubscriptionId).mockResolvedValue(
        makeSubscription({ providerSubscriptionId: 'sub-status' })
      )

      const service = buildResolveSubscriptionWebhookUserId(checkoutService, subscriptionRepository, makeLogger())

      await expect(service({
        webhookStatus: status,
        checkoutReferenceId: null,
        providerSubscriptionId: 'sub-status'
      })).resolves.toBe(VALID_USER_ID)
    })
  })
})
