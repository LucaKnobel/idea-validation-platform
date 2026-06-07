import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when an experiment cannot be found for the current user.
 */
export class ExperimentNotFoundError extends ApplicationError {
  constructor() {
    super('Experiment not found.')
    this.name = 'ExperimentNotFoundError'
  }
}
