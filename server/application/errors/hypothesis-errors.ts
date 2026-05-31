import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when a hypothesis cannot be found for the current user.
 */
export class HypothesisNotFoundError extends ApplicationError {
  constructor() {
    super('Hypothesis not found.')
    this.name = 'HypothesisNotFoundError'
  }
}
