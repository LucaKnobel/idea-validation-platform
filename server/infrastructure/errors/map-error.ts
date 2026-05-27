import { createError, type H3Event } from 'h3'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'
import { IdeaHasNoVersionsError, IdeaNotFoundError } from '@application/errors/idea-errors'
import { logger } from '@infrastructure/logging/logger'

/**
 * Maps application and unexpected errors to safe HTTP errors for API handlers.
 */
export const mapError = (error: unknown, event?: H3Event): Error => {
  if (error instanceof Error && 'statusCode' in error) {
    return error
  }

  if (error instanceof SubscriptionLimitExceededError) {
    return createError({
      statusCode: 403,
      statusText: 'Subscription limit exceeded'
    })
  }

  if (error instanceof IdeaNotFoundError) {
    return createError({
      statusCode: 404,
      statusText: 'Idea not found'
    })
  }

  if (error instanceof IdeaHasNoVersionsError) {
    return createError({
      statusCode: 500,
      statusText: 'Idea data is incomplete'
    })
  }

  logger.error('Unhandled API error', {
    path: event?.path,
    method: event?.method
  }, error)

  return createError({
    statusCode: 500,
    statusText: 'Internal Server Error'
  })
}
