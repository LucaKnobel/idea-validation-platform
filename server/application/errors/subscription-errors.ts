import { ApplicationError } from '@application/errors/application-error'

export class SubscriptionLimitExceededError
  extends ApplicationError {
  constructor() {
    super('Business idea limit reached for current subscription plan.')
    this.name = 'SubscriptionLimitExceededError'
  }
}
