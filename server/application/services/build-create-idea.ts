import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Idea } from '@application/models/idea'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

export type CreateIdeaInput = {
  userId: string
  title: string
  description: string | null
}

/**
 * Builds the use case that creates one idea after subscription-limit checks.
 */
export const buildCreateIdea = (
  ideaRepository: IdeaRepository,
  subscriptionService: SubscriptionService,
  logger: Logger
) => {
  return async (input: CreateIdeaInput): Promise<Idea> => {
    const currentIdeaCount = await ideaRepository.countByUser(input.userId)

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
