import { logger } from '@infrastructure/logging/logger'
import { auth } from '@infrastructure/auth/auth'

const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/content',
  '/api/_nuxt_icon'
] as const

const startsWithAny = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some(prefix => path.startsWith(prefix))

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  if (!path.startsWith('/api')) return
  if (startsWithAny(path, PUBLIC_API_PREFIXES)) return

  const method = event.method || 'GET'
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'

  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user?.id) {
    logger.warn('Unauthorized access attempt', {
      source: 'security-middleware',
      event: 'security.unauthorized_request',
      path,
      method,
      ip,
      userAgent
    })

    throw createError({
      statusCode: 401,
      statusText: 'Authentication required'
    })
  }

  ;(event.context as { userId?: string }).userId = session.user.id
})
