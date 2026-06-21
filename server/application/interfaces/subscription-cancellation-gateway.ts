/**
 * Interface for provider-side subscription cancellation.
 */
export interface SubscriptionCancellationGateway {
  cancelSubscription(providerSubscriptionId: string): Promise<void>
}
