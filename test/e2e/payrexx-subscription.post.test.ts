import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'

import { clearAuthTables, createClientIp, getE2ESetupOptions } from './auth-test-helpers'
import { payrexxWebhookSecret } from './subscription-test-helpers'

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
})
