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

/**
 * Raised when a subscription record for the user cannot be found.
 */
export class SubscriptionNotFoundError
  extends ApplicationError {
  constructor() {
    super('Subscription not found.')
    this.name = 'SubscriptionNotFoundError'
  }
}

/**
 * Raised when cancellation is requested for a non-PRO subscription.
 */
export class SubscriptionCancellationUnavailableError
  extends ApplicationError {
  constructor() {
    super('Subscription cancellation is only available for PRO subscriptions.')
    this.name = 'SubscriptionCancellationUnavailableError'
  }
}

/**
 * Raised when provider identifiers are missing for a cancellable subscription.
 */
export class SubscriptionProviderSubscriptionIdMissingError
  extends ApplicationError {
  constructor() {
    super('Provider subscription id is missing.')
    this.name = 'SubscriptionProviderSubscriptionIdMissingError'
  }
}

/**
 * Raised when a checkout record cannot be found by its id.
 */
export class SubscriptionCheckoutNotFoundError
  extends ApplicationError {
  constructor() {
    super('Subscription checkout not found.')
    this.name = 'SubscriptionCheckoutNotFoundError'
  }
}

/**
 * Raised when a checkout has already been consumed.
 */
export class SubscriptionCheckoutAlreadyConsumedError
  extends ApplicationError {
  constructor() {
    super('Subscription checkout has already been consumed.')
    this.name = 'SubscriptionCheckoutAlreadyConsumedError'
  }
}
