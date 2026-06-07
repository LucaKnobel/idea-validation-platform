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
