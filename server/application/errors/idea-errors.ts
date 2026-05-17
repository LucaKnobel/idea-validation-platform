import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when an idea cannot be found for the current user.
 */
export class IdeaNotFoundError extends ApplicationError {
  constructor() {
    super('Idea not found.')
    this.name = 'IdeaNotFoundError'
  }
}
