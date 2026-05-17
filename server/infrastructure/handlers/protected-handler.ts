import { createError, defineEventHandler, type EventHandlerRequest, type H3Event } from 'h3'
import { mapError } from '@infrastructure/errors/map-error'
import { auth } from '@infrastructure/auth/auth'

type ProtectedRouteHandler<T extends EventHandlerRequest, D> = (
  event: H3Event<T>,
  userId: string
) => D | Promise<D>

export const defineProtectedHandler = <T extends EventHandlerRequest, D>(
  handler: ProtectedRouteHandler<T, D>
) => {
  return defineEventHandler<T>(async (event) => {
    try {
      const session = await auth.api.getSession({ headers: event.headers })

      if (!session?.user) {
        throw createError({ statusCode: 401, statusText: 'Unauthorized' })
      }

      const userId = session.user.id
      return await handler(event, userId)
    } catch (error) {
      throw mapError(error, event)
    }
  })
}
