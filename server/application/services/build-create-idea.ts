import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Idea } from '@application/models/idea'
import type { SubscriptionAccessService } from '@application/interfaces/subscription-access-service'
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
  subscriptionService: SubscriptionAccessService,
  logger: Logger
) => {
  return async (input: CreateIdeaInput): Promise<Idea> => {
    const currentIdeaCount = await ideaRepository.countByUser(input.userId)

    // Plan gating only applies to creating new ideas; existing ideas remain fully editable.
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
