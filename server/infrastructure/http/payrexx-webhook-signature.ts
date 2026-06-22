import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Normalizes signature header values (e.g. trims and removes optional sha256= prefix).
 */
const normalizeExpectedSignature = (value: string): string => {
  return value.trim().replace(/^sha256=/i, '')
}

/**
 * Detects whether the incoming signature is encoded as a hex SHA-256 digest.
 */
const isHexSignature = (value: string): boolean => /^[a-f0-9]{64}$/i.test(value)

/**
 * Verifies a Payrexx webhook signature using HMAC-SHA256 and constant-time comparison.
 * Accepts hex and base64 encoded signatures.
 */
export const verifyPayrexxWebhookSignature = (
  rawBody: string | Buffer,
  expectedSignature: string,
  signingKey: string
): boolean => {
  const normalizedExpected = normalizeExpectedSignature(expectedSignature)

  const expectedDigest = isHexSignature(normalizedExpected)
    ? Buffer.from(normalizedExpected, 'hex')
    : Buffer.from(normalizedExpected, 'base64')

  const actualDigest = createHmac('sha256', signingKey).update(rawBody).digest()

  return expectedDigest.length === actualDigest.length
    && timingSafeEqual(actualDigest, expectedDigest)
}
