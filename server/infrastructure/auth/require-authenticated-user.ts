import type { H3Event } from 'h3'
import { auth } from '@infrastructure/auth/auth'

export const requireAuthenticatedUserId = async (event: H3Event): Promise<string> => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return session.user.id
}
