import { ApplicationError } from '@application/errors/application-error'

/**
 * Raised when a user tries to create more ideas than allowed by the current plan.
 */
export class SubscriptionLimitExceededError
  extends ApplicationError {
  constructor() {
    super('Business idea limit reached for current subscription plan.')
    this.name = 'SubscriptionLimitExceededError'
  }
}
