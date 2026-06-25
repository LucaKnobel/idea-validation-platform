import { withLeadingSlash } from 'ufo'
import { toWebRequest } from 'h3'
import { GetContentParamsSchema, GetContentQuerySchema } from '@infrastructure/validation/content-schemas'
import { queryCollection } from '@nuxt/content/server'
import type { AppLocale } from '@shared/types/locale'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { resolveLocaleFromRequest } from '@infrastructure/http/locale-resolver'

/**
 * Resolves localized content by slug and falls back to English when a translated page is missing.
 */
export default definePublicHandler(async (event) => {
  await enforceRateLimit(event, {
    name: 'content.read',
    maxRequests: 100,
    windowSeconds: 60,
    scope: 'ip'
  })

  const params = await getValidatedRouterParams(event, GetContentParamsSchema.parse)
  const query = await getValidatedQuery(event, GetContentQuerySchema.parse)
  const locale: AppLocale = query.locale ?? resolveLocaleFromRequest(toWebRequest(event))
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
