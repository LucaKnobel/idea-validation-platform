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

/**
 * Raised when an idea version cannot be found for the current user.
 */
export class IdeaVersionNotFoundError extends ApplicationError {
  constructor() {
    super('Idea version not found.')
    this.name = 'IdeaVersionNotFoundError'
  }
}

/**
 * Raised when an idea exists but has no versions, violating domain invariants.
 */
export class IdeaHasNoVersionsError extends ApplicationError {
  constructor(ideaId: string) {
    super(`Idea ${ideaId} has no versions.`)
    this.name = 'IdeaHasNoVersionsError'
  }
}
