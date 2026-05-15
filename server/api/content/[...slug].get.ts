import { withLeadingSlash } from 'ufo'
import { getCookie } from 'h3'
import { GetContentParamsSchema } from '@server/api/schemas/content-schemas'
import { queryCollection } from '@nuxt/content/server'
import type { AppLocale } from '@shared/types/locale'
import { enforceRateLimit } from '@server/api/rate-limit/enforce-rate-limit'

const parseRateLimitNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const maxRequests = parseRateLimitNumber(config.contentReadRateLimitMax, 100)
  const windowSeconds = parseRateLimitNumber(config.contentReadRateLimitWindowSeconds, 60)

  await enforceRateLimit(event, {
    name: 'content.read',
    maxRequests,
    windowSeconds,
    scope: 'ip'
  })

  const params = await getValidatedRouterParams(event, GetContentParamsSchema.parse)
  const cookieLocale = getCookie(event, 'i18n_redirected')
  const locale: AppLocale = cookieLocale === 'de' || cookieLocale === 'en' ? cookieLocale : 'en'
  const collection = locale === 'de' ? 'content_de' : 'content_en'
  const slug = withLeadingSlash(params.slug)

  let content = await queryCollection(event, collection).path(slug).first()

  if (!content && locale !== 'en') {
    content = await queryCollection(event, 'content_en')
      .path(slug)
      .first()
  }

  if (!content) {
    throw createError({ status: 404, statusText: 'Content not found' })
  }

  return content
})
