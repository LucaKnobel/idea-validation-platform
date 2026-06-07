import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when a measurement cannot be found for the current user.
 */
export class MeasurementNotFoundError extends ApplicationError {
  constructor() {
    super('Measurement not found.')
    this.name = 'MeasurementNotFoundError'
  }
}

/**
 * Raised when a measurement already exists for the same metric in one experiment.
 */
export class MeasurementMetricAlreadyExistsError extends ApplicationError {
  constructor() {
    super('Measurement already exists for this metric in the experiment.')
    this.name = 'MeasurementMetricAlreadyExistsError'
  }
}
