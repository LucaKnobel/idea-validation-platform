import { withLeadingSlash } from 'ufo'
import { getCookie } from 'h3'
import { GetContentParamsSchema } from '@server/api/schemas/content-schemas'
import { queryCollection } from '@nuxt/content/server'
import type { AppLocale } from '@shared/types/locale'
import { enforceRateLimit } from '@server/api/rate-limit/enforce-rate-limit'

/**
 * Resolves localized content by slug and falls back to English when a translated page is missing.
 */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    name: 'content.read',
    maxRequests: 100,
    windowSeconds: 60,
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
