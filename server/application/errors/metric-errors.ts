import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when a metric cannot be found for the current user.
 */
export class MetricNotFoundError extends ApplicationError {
  constructor() {
    super('Metric not found.')
    this.name = 'MetricNotFoundError'
  }
}

/**
 * Raised when a metric threshold cannot be found for the current user.
 */
export class MetricThresholdNotFoundError extends ApplicationError {
  constructor() {
    super('Metric threshold not found.')
    this.name = 'MetricThresholdNotFoundError'
  }
}
