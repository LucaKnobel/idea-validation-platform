import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'

import type { SubscriptionPlan, SubscriptionStatus } from '@application/models/subscription'
import { clearAuthTables, createAuthenticatedSession, createClientIp, expectAuthenticatedSessionCreated, getE2ESetupOptions } from './auth-test-helpers'
import { createSubscription, getWithCookie } from './subscription-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('GET /api/subscription/status integration', async () => {
  await setup(getE2ESetupOptions())

  it('requires authentication', async () => {
    const response = await fetch(url('/api/subscription/status'), {
      method: 'GET',
      headers: {
        'x-forwarded-for': createClientIp()
      }
    })

    expect(response.status).toBe(401)
  })

  it('returns null subscription fields for an authenticated user without a subscription', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'subscription-status-empty',
      name: 'Subscription Status Empty Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getWithCookie('/api/subscription/status', user.cookieHeader)

    expect(response.status).toBe(200)

    const payload = await response.json() as {
      plan: SubscriptionPlan | null
      status: SubscriptionStatus | null
      currentPeriodEnd: string | null
      isPro: boolean
    }

    expect(payload.plan).toBeNull()
    expect(payload.status).toBeNull()
    expect(payload.currentPeriodEnd).toBeNull()
    expect(payload.isPro).toBe(false)
  })

  it('returns the persisted subscription state for an active PRO user', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'subscription-status-pro',
      name: 'Subscription Status Pro Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const currentPeriodEnd = new Date('2026-06-30T23:59:59.000Z')
    await createSubscription({
      userId: user.id,
      plan: 'PRO',
      status: 'ACTIVE',
      providerCustomerId: 'payrexx-customer-1',
      providerSubscriptionId: 'payrexx-subscription-1',
      currentPeriodEnd
    })

    const response = await getWithCookie('/api/subscription/status', user.cookieHeader)

    expect(response.status).toBe(200)

    const payload = await response.json() as {
      plan: SubscriptionPlan | null
      status: SubscriptionStatus | null
      currentPeriodEnd: string | null
      isPro: boolean
    }

    expect(payload.plan).toBe('PRO')
    expect(payload.status).toBe('ACTIVE')
    expect(payload.currentPeriodEnd).toBe(currentPeriodEnd.toISOString())
    expect(payload.isPro).toBe(true)
  })
})
