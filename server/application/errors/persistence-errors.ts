import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when a persistence layer detects a unique-constraint violation.
 */
export class UniqueConstraintViolationError extends ApplicationError {
  constructor() {
    super('Unique constraint violation.')
    this.name = 'UniqueConstraintViolationError'
  }
}
