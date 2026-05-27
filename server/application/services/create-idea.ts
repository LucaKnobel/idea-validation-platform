import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { IdeaSummary } from '@application/models/idea-summary'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

/**
 * Builds the use case that creates a new idea after enforcing subscription limits.
 */
export const createCreateIdea = (
  ideaRepository: IdeaRepository,
  subscriptionService: SubscriptionService,
  logger: Logger
) => {
  return async (
    input: { userId: string, title: string, description: string | null }
  ): Promise<IdeaSummary> => {
    const currentIdeaCount = await ideaRepository.countByUserId(input.userId)

    await subscriptionService.assertCanCreateBusinessIdea(input.userId, currentIdeaCount)

    const createdIdea = await ideaRepository.create({
      userId: input.userId,
      title: input.title,
      description: input.description
    })

    logger.debug('Idea created', { userId: input.userId, ideaId: createdIdea.id })

    return createdIdea
  }
}
