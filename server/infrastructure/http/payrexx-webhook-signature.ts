import { createHmac, timingSafeEqual } from 'node:crypto'

const computeSignatureCandidates = (rawBody: string, signingKey: string): string[] => {
  const hexDigest = createHmac('sha256', signingKey).update(rawBody).digest('hex')
  const base64Digest = createHmac('sha256', signingKey).update(rawBody).digest('base64')

  return [hexDigest, base64Digest]
}

export const verifyPayrexxWebhookSignature = (
  rawBody: string,
  expectedSignature: string,
  signingKey: string
): boolean => {
  const expectedBuffer = Buffer.from(expectedSignature.trim())

  return computeSignatureCandidates(rawBody, signingKey).some((candidate) => {
    const candidateBuffer = Buffer.from(candidate)

    return candidateBuffer.length === expectedBuffer.length
      && timingSafeEqual(candidateBuffer, expectedBuffer)
  })
}
