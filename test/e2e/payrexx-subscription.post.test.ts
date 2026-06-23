import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'

import { prisma } from '@infrastructure/db/prisma'
import {
  clearAuthTables,
  createAuthenticatedSession,
  createClientIp,
  expectAuthenticatedSessionCreated,
  getE2ESetupOptions
} from './auth-test-helpers'
import { createSubscription, payrexxWebhookSecret } from './subscription-test-helpers'

const signWebhookBody = (rawBody: string): string => {
  return createHmac('sha256', payrexxWebhookSecret ?? '').update(rawBody).digest('hex')
}

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('POST /api/webhooks/payrexx/subscription integration', async () => {
  await setup(getE2ESetupOptions())

  it('uses configured webhook secret from test environment', async () => {
    expect(payrexxWebhookSecret).toBeTruthy()
  })

  it('rejects requests without x-webhook-signature header', async () => {
    const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify({
        transaction: {
          subscription: null
        }
      })
    })

    expect(response.status).toBe(401)
  })

  it('rejects an invalid signature with 401', async () => {
    const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': createClientIp(),
        'x-webhook-signature': 'invalid-or-tampered-signature'
      },
      body: JSON.stringify({
        transaction: {
          subscription: {
            id: 62624,
            status: 'active'
          }
        }
      })
    })

    expect(response.status).toBe(401)
  })

  it('rejects null subscription housekeeping with invalid signature', async () => {
    const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': createClientIp(),
        'x-webhook-signature': 'any-invalid-signature'
      },
      body: JSON.stringify({
        transaction: {
          subscription: null
        }
      })
    })

    expect(response.status).toBe(401)
  })

  // Flow 1: Active subscription (purchase)
  describe('Flow 1: Active subscription (purchase confirmation)', () => {
    it('consumes checkout and creates subscription when status=active', async () => {
      expect(payrexxWebhookSecret).toBeTruthy()

      const sessionResult = await createAuthenticatedSession({
        emailPrefix: 'payrexx-webhook-active-purchase',
        name: 'Active Purchase User'
      })
      const user = expectAuthenticatedSessionCreated(sessionResult)

      const checkoutId = '868d2f2e-f70f-4903-b9e0-a5cea2d33900'
      const providerSubscriptionId = '62670'

      await prisma.subscriptionCheckout.create({
        data: {
          id: checkoutId,
          userId: user.id,
          consumedAt: null
        }
      })

      const requestBody = JSON.stringify({
        subscription: {
          id: Number.parseInt(providerSubscriptionId, 10),
          status: 'active',
          end: '2027-06-23',
          valid_until: null,
          invoice: {
            referenceId: checkoutId
          },
          contact: {
            uuid: 'customer-uuid-001'
          }
        }
      })

      const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': createClientIp(),
          'x-webhook-signature': signWebhookBody(requestBody)
        },
        body: requestBody
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ ok: true })

      // Verify checkout was consumed
      const consumedCheckout = await prisma.subscriptionCheckout.findUnique({
        where: { id: checkoutId }
      })
      expect(consumedCheckout?.consumedAt).not.toBeNull()

      // Verify subscription was created
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id }
      })
      expect(subscription?.status).toBe('ACTIVE')
      expect(subscription?.plan).toBe('PRO')
      expect(subscription?.providerSubscriptionId).toBe(providerSubscriptionId)
    })

    it('falls back to provider subscription id when checkout not found (status=active)', async () => {
      expect(payrexxWebhookSecret).toBeTruthy()

      const sessionResult = await createAuthenticatedSession({
        emailPrefix: 'payrexx-webhook-active-fallback',
        name: 'Active Fallback User'
      })
      const user = expectAuthenticatedSessionCreated(sessionResult)

      const providerSubscriptionId = '62671'

      // Pre-create subscription (simulating a retry or duplicate webhook)
      await createSubscription({
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        providerCustomerId: 'customer-uuid-002',
        providerSubscriptionId
      })

      const requestBody = JSON.stringify({
        subscription: {
          id: Number.parseInt(providerSubscriptionId, 10),
          status: 'active',
          end: '2027-06-24',
          valid_until: null,
          invoice: {
            referenceId: 'missing-checkout-id'
          },
          contact: {
            uuid: 'customer-uuid-002'
          }
        }
      })

      const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': createClientIp(),
          'x-webhook-signature': signWebhookBody(requestBody)
        },
        body: requestBody
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ ok: true })

      // Verify subscription still active (idempotent)
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id }
      })
      expect(subscription?.status).toBe('ACTIVE')
      expect(subscription?.plan).toBe('PRO')
    })
  })

  // Flow 2: Non-active subscription (cancellation, overdue, etc.)
  describe('Flow 2: Non-active subscription (cancellation, overdue, etc.)', () => {
    it('syncs cancellation webhook by provider subscription id (status=cancelled)', async () => {
      expect(payrexxWebhookSecret).toBeTruthy()

      const sessionResult = await createAuthenticatedSession({
        emailPrefix: 'payrexx-webhook-cancelled',
        name: 'Cancelled User'
      })
      const user = expectAuthenticatedSessionCreated(sessionResult)

      const checkoutId = '868d2f2e-f70f-4903-b9e0-a5cea2d33901'
      const providerSubscriptionId = '62672'

      // Checkout already consumed from purchase
      await prisma.subscriptionCheckout.create({
        data: {
          id: checkoutId,
          userId: user.id,
          consumedAt: new Date()
        }
      })

      // Subscription exists and is active
      await createSubscription({
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        providerCustomerId: '1fe2a5cf',
        providerSubscriptionId
      })

      const requestBody = JSON.stringify({
        subscription: {
          id: Number.parseInt(providerSubscriptionId, 10),
          status: 'cancelled',
          end: '2026-06-23',
          valid_until: null,
          invoice: {
            referenceId: checkoutId
          },
          contact: {
            uuid: '1fe2a5cf'
          }
        }
      })

      const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': createClientIp(),
          'x-webhook-signature': signWebhookBody(requestBody)
        },
        body: requestBody
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ ok: true })

      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id }
      })

      expect(subscription?.status).toBe('CANCELLED')
      expect(subscription?.plan).toBe('FREE')
    })

    it('returns 200 idempotent when subscription not found (status=cancelled)', async () => {
      expect(payrexxWebhookSecret).toBeTruthy()

      const providerSubscriptionId = '62673'

      const requestBody = JSON.stringify({
        subscription: {
          id: Number.parseInt(providerSubscriptionId, 10),
          status: 'cancelled',
          end: '2026-06-24',
          valid_until: null,
          invoice: {
            referenceId: 'some-checkout-id'
          },
          contact: {
            uuid: 'unknown-customer'
          }
        }
      })

      const response = await fetch(url('/api/webhooks/payrexx/subscription'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': createClientIp(),
          'x-webhook-signature': signWebhookBody(requestBody)
        },
        body: requestBody
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ ok: true })
    })
  })
})
