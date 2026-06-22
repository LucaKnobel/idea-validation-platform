import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'

import { clearAuthTables, createAuthenticatedSession, createClientIp, expectAuthenticatedSessionCreated, getE2ESetupOptions } from './auth-test-helpers'
import { createSubscription, postWithCookie } from './subscription-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('POST /api/subscription/cancel integration', async () => {
  await setup(getE2ESetupOptions())

  it('requires authentication', async () => {
    const response = await fetch(url('/api/subscription/cancel'), {
      method: 'POST',
      headers: {
        'x-forwarded-for': createClientIp()
      },
      body: '{}'
    })

    expect(response.status).toBe(401)
  })

  it('returns 404 when cancelling without a subscription', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'subscription-cancel-missing',
      name: 'Subscription Cancel Missing Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await postWithCookie('/api/subscription/cancel', user.cookieHeader)

    expect(response.status).toBe(404)
  })

  it('returns 409 when cancelling a non-PRO subscription', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'subscription-cancel-free',
      name: 'Subscription Cancel Free Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    await createSubscription({
      userId: user.id,
      plan: 'FREE',
      status: 'ACTIVE',
      currentPeriodEnd: null
    })

    const response = await postWithCookie('/api/subscription/cancel', user.cookieHeader)

    expect(response.status).toBe(409)
  })

  it('returns 500 when cancelling a PRO subscription without a provider subscription id', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'subscription-cancel-missing-provider-id',
      name: 'Subscription Cancel Missing Provider Id Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    await createSubscription({
      userId: user.id,
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-customer-2',
      providerSubscriptionId: null,
      currentPeriodEnd: new Date('2026-06-30T23:59:59.000Z')
    })

    const response = await postWithCookie('/api/subscription/cancel', user.cookieHeader)

    expect(response.status).toBe(500)
  })
})
