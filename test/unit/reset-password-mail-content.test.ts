import { describe, expect, it } from 'vitest'
import { buildResetPasswordMailContent } from '@infrastructure/mail/reset-password-mail-content'

const RESET_URL = 'https://example.com/reset-password?token=abc'

const localeCases = [
  {
    locale: 'en',
    expectedSubject: 'Reset your password',
    expectedLang: 'en'
  },
  {
    locale: 'de',
    expectedSubject: 'Setzen Sie Ihr Passwort zurück',
    expectedLang: 'de'
  }
] as const

describe('buildResetPasswordMailContent', () => {
  it.each(localeCases)('builds $locale locale mail content correctly', ({ locale, expectedSubject, expectedLang }) => {
    const result = buildResetPasswordMailContent(RESET_URL, locale)

    expect(result.subject).toBe(expectedSubject)
    expect(result.text).toContain(RESET_URL)
    expect(result.text).not.toContain('{{resetUrl}}')
    expect(result.html).toContain(RESET_URL)
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain(`<html lang="${expectedLang}">`)
  })
})
