import { createError, type H3Event } from 'h3'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'
import { IdeaHasNoVersionsError, IdeaNotFoundError, IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import { MetricNotFoundError } from '@application/errors/metric-errors'
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

  if (error instanceof IdeaVersionNotFoundError) {
    return createError({
      statusCode: 404,
      statusText: 'Idea version not found'
    })
  }

  if (error instanceof IdeaHasNoVersionsError) {
    return createError({
      statusCode: 500,
      statusText: 'Idea data is incomplete'
    })
  }

  if (error instanceof HypothesisNotFoundError) {
    return createError({
      statusCode: 404,
      statusText: 'Hypothesis not found'
    })
  }

  if (error instanceof MetricNotFoundError) {
    return createError({
      statusCode: 404,
      statusText: 'Metric not found'
    })
  }

  if (error instanceof ExperimentNotFoundError) {
    return createError({
      statusCode: 404,
      statusText: 'Experiment not found'
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
