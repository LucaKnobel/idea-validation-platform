import { createError, type H3Event } from 'h3'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'
import { logger } from '@infrastructure/logging/logger'

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

  logger.error('Unhandled API error', {
    path: event?.path,
    method: event?.method
  }, error)

  return createError({
    statusCode: 500,
    statusText: 'Internal Server Error'
  })
}
