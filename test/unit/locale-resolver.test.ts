import { describe, expect, it } from 'vitest'
import { resolveLocaleFromRequest } from '@infrastructure/http/locale-resolver'

describe('resolveLocaleFromRequest', () => {
  it('uses locale from i18n cookie when present', () => {
    const request = new Request('https://example.com', {
      headers: {
        'cookie': 'i18n_redirected=de; other=value',
        'accept-language': 'en-US,en;q=0.9'
      }
    })

    expect(resolveLocaleFromRequest(request)).toBe('de')
  })

  it('decodes URL-encoded cookie value', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: 'i18n_redirected=%64%65'
      }
    })

    expect(resolveLocaleFromRequest(request)).toBe('de')
  })

  it('falls back to accept-language when cookie is invalid', () => {
    const request = new Request('https://example.com', {
      headers: {
        'cookie': 'i18n_redirected=fr',
        'accept-language': 'de-CH,de;q=0.9,en;q=0.8'
      }
    })

    expect(resolveLocaleFromRequest(request)).toBe('de')
  })

  it('falls back to english when neither cookie nor german accept-language exists', () => {
    const request = new Request('https://example.com', {
      headers: {
        'accept-language': 'en-US,en;q=0.9'
      }
    })

    expect(resolveLocaleFromRequest(request)).toBe('en')
  })

  it('defaults to english for missing request', () => {
    expect(resolveLocaleFromRequest()).toBe('en')
  })
})
