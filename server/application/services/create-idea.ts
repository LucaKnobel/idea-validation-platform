import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Idea } from '@application/models/idea'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

/**
 * Builds the use case that creates a new idea after enforcing subscription limits.
 */
export const createCreateIdea = (
  ideaRepository: IdeaRepository,
  ideaVersionRepository: IdeaVersionRepository,
  subscriptionService: SubscriptionService,
  logger: Logger
) => {
  return async (
    input: { userId: string, title: string, description: string | null }
  ): Promise<Idea> => {
    const currentIdeaCount = await ideaRepository.countByUserId(input.userId)

    await subscriptionService.assertCanCreateBusinessIdea(input.userId, currentIdeaCount)

    const createdIdea = await ideaRepository.create({ userId: input.userId })

    try {
      const initialVersion = await ideaVersionRepository.createInitial({
        ideaId: createdIdea.id,
        title: input.title,
        description: input.description
      })

      const ideaWithInitialVersion: Idea = {
        ...createdIdea,
        versions: [initialVersion]
      }

      logger.debug('Idea created', { userId: input.userId, ideaId: createdIdea.id })

      return ideaWithInitialVersion
    } catch (error) {
      await ideaRepository.deleteByIdForUser({
        userId: input.userId,
        ideaId: createdIdea.id
      })

      throw error
    }
  }
}
