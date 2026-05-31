import type { Subscription } from '@application/models/subscription'

export interface SubscriptionService {
  getByUserId(userId: string): Promise<Subscription | null>

  isPro(userId: string): Promise<boolean>

  getBusinessIdeaLimit(userId: string): Promise<number>

  createFreeSubscription(userId: string): Promise<Subscription>

  assertCanCreateBusinessIdea(
    userId: string,
    currentIdeaCount: number
  ): Promise<void>
}
