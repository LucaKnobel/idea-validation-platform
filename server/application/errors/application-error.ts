/**
 * Base class for business errors originating from the application layer.
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApplicationError'
  }
}
