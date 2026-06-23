import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when a user cannot be found for account deletion.
 */
export class UserNotFoundError extends ApplicationError {
  constructor() {
    super('User not found.')
    this.name = 'UserNotFoundError'
  }
}
