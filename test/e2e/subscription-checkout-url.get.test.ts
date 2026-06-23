import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'

import { prisma } from '@infrastructure/db/prisma'
import { clearAuthTables, createAuthenticatedSession, createClientIp, expectAuthenticatedSessionCreated, getE2ESetupOptions } from './auth-test-helpers'
import { payrexxCheckoutPageUrl } from './subscription-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('GET /api/subscription/checkout-url integration', async () => {
  await setup(getE2ESetupOptions())

  it('requires authentication', async () => {
    const response = await fetch(url('/api/subscription/checkout-url'), {
      method: 'GET',
      headers: {
        'x-forwarded-for': createClientIp()
      }
    })

    expect(response.status).toBe(401)
  })

  it('returns a checkout URL and persists a checkout record', async () => {
    expect(payrexxCheckoutPageUrl).toBeTruthy()

    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'subscription-checkout',
      name: 'Subscription Checkout Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await fetch(url('/api/subscription/checkout-url'), {
      method: 'GET',
      headers: {
        'cookie': user.cookieHeader,
        'origin': new URL(url('/')).origin,
        'referer': `${new URL(url('/')).origin}/`,
        'x-forwarded-for': createClientIp()
      }
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as { checkoutUrl?: string }
    expect(payload.checkoutUrl).toBeTruthy()

    const checkoutUrl = new URL(payload.checkoutUrl ?? '')
    const referenceId = checkoutUrl.searchParams.get('referenceId')
    expect(referenceId).toBeTruthy()

    const checkout = await prisma.subscriptionCheckout.findUnique({
      where: { id: referenceId ?? '' }
    })

    expect(checkout).not.toBeNull()
    expect(checkout?.userId).toBe(user.id)
    expect(checkout?.consumedAt).toBeNull()
  })
})
