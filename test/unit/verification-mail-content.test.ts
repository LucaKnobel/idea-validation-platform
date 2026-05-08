import { describe, expect, it } from 'vitest'
import { buildVerificationMailContent } from '../../server/infrastructure/mail/verification-mail-content'

describe('buildVerificationMailContent', () => {
  it('builds german content with link and localized copy', () => {
    const verifyUrl = 'https://example.com/verify?token=abc123'
    const result = buildVerificationMailContent(verifyUrl, 'de')

    expect(result.subject).toBe('Bitte bestätige deine E-Mail-Adresse')
    expect(result.text).toContain(verifyUrl)
    expect(result.text).toContain('1 Stunde gültig')
    expect(result.html).toContain('<html lang="de">')
    expect(result.html).toContain('E-Mail-Adresse bestätigen')
    expect(result.html).toContain(verifyUrl)
  })

  it('builds english content with link and localized copy', () => {
    const verifyUrl = 'https://example.com/verify?token=xyz789'
    const result = buildVerificationMailContent(verifyUrl, 'en')

    expect(result.subject).toBe('Please verify your email address')
    expect(result.text).toContain(verifyUrl)
    expect(result.text).toContain('valid for 1 hour')
    expect(result.html).toContain('<html lang="en">')
    expect(result.html).toContain('Verify your email address')
    expect(result.html).toContain(verifyUrl)
  })
})
