import { describe, expect, it } from 'vitest'
import { buildVerificationMailContent } from '@infrastructure/mail/verification-mail-content'

const VERIFY_URL = 'https://example.com/verify?token=abc'

const localeCases = [
  {
    locale: 'en',
    expectedSubject: 'Please verify your email address',
    expectedLang: 'en'
  },
  {
    locale: 'de',
    expectedSubject: 'Bitte bestätigen Sie Ihre E-Mail-Adresse',
    expectedLang: 'de'
  }
] as const

describe('buildVerificationMailContent', () => {
  it.each(localeCases)('builds $locale locale mail content correctly', ({ locale, expectedSubject, expectedLang }) => {
    const result = buildVerificationMailContent(VERIFY_URL, locale)

    expect(result.subject).toBe(expectedSubject)
    expect(result.text).toContain(VERIFY_URL)
    expect(result.text).not.toContain('{{verifyUrl}}')
    expect(result.html).toContain(VERIFY_URL)
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain(`<html lang="${expectedLang}">`)
  })
})
