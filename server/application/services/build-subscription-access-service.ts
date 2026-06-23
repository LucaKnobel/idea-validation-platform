import type { SubscriptionAccessService } from '@application/interfaces/subscription-access-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription } from '@application/models/subscription'
import type { Logger } from '@interfaces/logger'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'

const FREE_BUSINESS_IDEA_LIMIT = 1

/**
 * Evaluates whether a subscription currently grants effective PRO access.
 *
 * Rules:
 * - Non-PRO plans never grant PRO access.
 * - ACTIVE grants access; CANCELLED does not.
 */
const hasEffectiveProAccess = (
  subscription: Subscription
): boolean => {
  if (subscription.plan !== 'PRO') {
    return false
  }

  return subscription.status === 'ACTIVE'
}

/**
 * Builds the access and policy service for subscriptions.
 *
 * Evaluates subscription access and enforces policy (isPro, limits, assertions).
 */
export const buildSubscriptionAccessService = (
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
): SubscriptionAccessService => {
  const getByUserId = async (
    userId: string
  ): Promise<Subscription | null> => {
    return subscriptionRepository.findByUserId(userId)
  }

  const isPro = async (
    userId: string
  ): Promise<boolean> => {
    const subscription = await getByUserId(userId)

    if (!subscription) {
      return false
    }

    return hasEffectiveProAccess(subscription)
  }

  const getStatusSnapshot = async (
    userId: string
  ): Promise<{
    subscription: Subscription | null
    isPro: boolean
  }> => {
    const subscription = await getByUserId(userId)

    return {
      subscription,
      isPro: subscription ? hasEffectiveProAccess(subscription) : false
    }
  }

  const getBusinessIdeaLimit = async (
    userId: string
  ): Promise<number> => {
    return (await isPro(userId))
      ? Number.POSITIVE_INFINITY
      : FREE_BUSINESS_IDEA_LIMIT
  }

  const assertCanCreateBusinessIdea = async (
    userId: string,
    currentIdeaCount: number
  ): Promise<void> => {
    const limit = await getBusinessIdeaLimit(userId)

    if (currentIdeaCount >= limit) {
      logger.warn('Business idea limit exceeded', {
        source: 'subscription-access-service',
        event: 'subscription.limit_exceeded',
        userId,
        currentIdeas: currentIdeaCount,
        limit: limit === Number.POSITIVE_INFINITY ? 'unlimited' : limit
      })
      throw new SubscriptionLimitExceededError()
    }
  }

  return {
    getByUserId,
    getStatusSnapshot,
    isPro,
    getBusinessIdeaLimit,
    assertCanCreateBusinessIdea
  }
}
