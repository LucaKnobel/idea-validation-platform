import type { Subscription } from '@application/models/subscription'

/**
 * Access and policy interface for subscription-dependent decisions.
 */
export interface SubscriptionAccessService {
  getByUserId(userId: string): Promise<Subscription | null>

  getStatusSnapshot(userId: string): Promise<{
    subscription: Subscription | null
    isPro: boolean
  }>

  isPro(userId: string): Promise<boolean>

  getBusinessIdeaLimit(userId: string): Promise<number>

  assertCanCreateBusinessIdea(
    userId: string,
    currentIdeaCount: number
  ): Promise<void>
}
