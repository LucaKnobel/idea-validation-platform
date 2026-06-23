import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeLogger } from './helpers'

const state = vi.hoisted(() => ({
  verifySignature: vi.fn()
}))

vi.mock('@infrastructure/http/payrexx-webhook-signature', () => ({
  verifyPayrexxWebhookSignature: state.verifySignature
}))

describe('readVerifiedPayrexxSubscriptionWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('createError', ({ statusCode, statusMessage }: { statusCode: number, statusMessage: string }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      return error
    })

    vi.stubGlobal('useRuntimeConfig', () => ({
      payrexxWebhookSecret: 'webhook-secret'
    }))

    vi.stubGlobal('readRawBody', vi.fn().mockResolvedValue('{"subscription":{"id":62624}}'))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue('header-signature'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      subscription: {
        id: 62624,
        status: 'active',
        end: '2026-06-22',
        valid_until: null,
        invoice: { referenceId: 'checkout-001' },
        contact: { uuid: 'contact-001' }
      }
    }))

    state.verifySignature.mockReturnValue(true)
  })

  it('throws 500 when webhook secret is missing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ payrexxWebhookSecret: '' }))
    const { readVerifiedPayrexxSubscriptionWebhook } = await import('@infrastructure/http/read-verified-payrexx-subscription-webhook')

    await expect(
      readVerifiedPayrexxSubscriptionWebhook({} as never, makeLogger())
    ).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 400 when webhook body is missing', async () => {
    vi.stubGlobal('readRawBody', vi.fn().mockResolvedValue(''))
    const { readVerifiedPayrexxSubscriptionWebhook } = await import('@infrastructure/http/read-verified-payrexx-subscription-webhook')

    await expect(
      readVerifiedPayrexxSubscriptionWebhook({} as never, makeLogger())
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 when signature verification fails', async () => {
    state.verifySignature.mockReturnValue(false)
    const { readVerifiedPayrexxSubscriptionWebhook } = await import('@infrastructure/http/read-verified-payrexx-subscription-webhook')

    await expect(
      readVerifiedPayrexxSubscriptionWebhook({} as never, makeLogger())
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns null and logs info for null subscription housekeeping payload', async () => {
    const logger = makeLogger()
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      transaction: { subscription: null }
    }))

    const { readVerifiedPayrexxSubscriptionWebhook } = await import('@infrastructure/http/read-verified-payrexx-subscription-webhook')
    const result = await readVerifiedPayrexxSubscriptionWebhook({} as never, logger)

    expect(result).toBeNull()
    expect(logger.info).toHaveBeenCalledWith('Webhook ignored because transaction subscription is null', {
      source: 'payrexx-subscription-webhook',
      event: 'payrexx.subscription_webhook.ignored_null_subscription'
    })
  })

  it('throws 400 and logs warning for invalid payload', async () => {
    const logger = makeLogger()
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ subscription: { id: 62624 } }))

    const { readVerifiedPayrexxSubscriptionWebhook } = await import('@infrastructure/http/read-verified-payrexx-subscription-webhook')

    await expect(
      readVerifiedPayrexxSubscriptionWebhook({} as never, logger)
    ).rejects.toMatchObject({ statusCode: 400 })

    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid Payrexx subscription webhook payload',
      expect.objectContaining({
        source: 'payrexx-subscription-webhook',
        event: 'payrexx.subscription_webhook.invalid_payload'
      })
    )
  })

  it('returns parsed webhook payload for valid request', async () => {
    const { readVerifiedPayrexxSubscriptionWebhook } = await import('@infrastructure/http/read-verified-payrexx-subscription-webhook')

    const result = await readVerifiedPayrexxSubscriptionWebhook({} as never, makeLogger())

    expect(result).toEqual({
      id: 62624,
      status: 'active',
      end: '2026-06-22',
      valid_until: null,
      invoice: { referenceId: 'checkout-001' },
      contact: { uuid: 'contact-001' }
    })
  })
})
