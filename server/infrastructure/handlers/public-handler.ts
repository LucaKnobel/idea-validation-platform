import { defineEventHandler, type EventHandlerRequest, type EventHandler } from 'h3'
import { mapError } from '@infrastructure/errors/map-error'

/**
 * Wraps public API handlers with centralized error mapping.
 */
export const definePublicHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>
): EventHandler<T, D> => {
  return defineEventHandler<T>(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      throw mapError(error, event)
    }
  })
}
