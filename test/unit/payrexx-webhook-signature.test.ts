import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyPayrexxWebhookSignature } from '@infrastructure/http/payrexx-webhook-signature'

const RAW_BODY = '{"subscription":{"id":62624}}'
const SIGNING_KEY = 'test-signing-key'

const createSignature = (encoding: 'hex' | 'base64', body = RAW_BODY, key = SIGNING_KEY): string => {
  return createHmac('sha256', key).update(body).digest(encoding)
}

describe('verifyPayrexxWebhookSignature', () => {
  it('accepts valid base64 signatures', () => {
    const signature = createSignature('base64')

    expect(verifyPayrexxWebhookSignature(RAW_BODY, signature, SIGNING_KEY)).toBe(true)
  })

  it('accepts valid hex signatures', () => {
    const signature = createSignature('hex')

    expect(verifyPayrexxWebhookSignature(RAW_BODY, signature, SIGNING_KEY)).toBe(true)
  })

  it('accepts signatures with sha256= prefix', () => {
    const signature = createSignature('hex')

    expect(verifyPayrexxWebhookSignature(RAW_BODY, `sha256=${signature}`, SIGNING_KEY)).toBe(true)
  })

  it('rejects signatures for modified payloads', () => {
    const signature = createSignature('base64')

    expect(verifyPayrexxWebhookSignature('{"subscription":{"id":1}}', signature, SIGNING_KEY)).toBe(false)
  })

  it('rejects signatures when signing key is wrong', () => {
    const signature = createSignature('base64')

    expect(verifyPayrexxWebhookSignature(RAW_BODY, signature, 'wrong-key')).toBe(false)
  })

  it('rejects malformed signatures', () => {
    expect(verifyPayrexxWebhookSignature(RAW_BODY, 'not-a-valid-signature', SIGNING_KEY)).toBe(false)
  })
})
