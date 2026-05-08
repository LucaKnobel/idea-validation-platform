import type { AppLocale } from '@shared/types/locale'

const I18N_COOKIE_KEY = 'i18n_redirected'

const normalizeLocale = (value: string | null | undefined): AppLocale | null => {
  if (value === 'de' || value === 'en') {
    return value
  }

  return null
}

const getCookieLocale = (request?: Request): AppLocale | null => {
  const cookieHeader = request?.headers.get('cookie')

  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = part.trim().split('=')

    if (rawName !== I18N_COOKIE_KEY) {
      continue
    }

    const rawValue = rawValueParts.join('=')
    return normalizeLocale(decodeURIComponent(rawValue))
  }

  return null
}

export const resolveLocaleFromRequest = (request?: Request | null): AppLocale => {
  const cookieLocale = getCookieLocale(request ?? undefined)

  if (cookieLocale) {
    return cookieLocale
  }

  const acceptLanguage = request?.headers.get('accept-language')?.toLowerCase() ?? ''
  return acceptLanguage.includes('de') ? 'de' : 'en'
}
