import { createHmac, timingSafeEqual } from 'node:crypto'

const computeSignatureCandidates = (rawBody: string | Buffer, signingKey: string): string[] => {
  const hexDigest = createHmac('sha256', signingKey).update(rawBody).digest('hex')
  const base64Digest = createHmac('sha256', signingKey).update(rawBody).digest('base64')

  return [hexDigest, base64Digest]
}

const normalizeExpectedSignature = (value: string): string => {
  return value.trim().replace(/^sha256=/i, '')
}

const safeEqual = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer)
}

export const verifyPayrexxWebhookSignature = (
  rawBody: string | Buffer,
  expectedSignature: string,
  signingKey: string
): boolean => {
  const normalizedExpected = normalizeExpectedSignature(expectedSignature)
  const isHexSignature = /^[a-f0-9]{64}$/i.test(normalizedExpected)
  const expectedHex = normalizedExpected.toLowerCase()

  return computeSignatureCandidates(rawBody, signingKey).some((candidate) => {
    if (isHexSignature) {
      return safeEqual(candidate.toLowerCase(), expectedHex)
    }

    return safeEqual(candidate, normalizedExpected)
  })
}
