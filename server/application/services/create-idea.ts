import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Idea } from '@application/models/idea'
import type { SubscriptionService } from '@application/interfaces/subscription-service'

export const createCreateIdea = (
  ideaRepository: IdeaRepository,
  subscriptionService: SubscriptionService
) => {
  return async (
    input: { userId: string, title: string, description: string | null }
  ): Promise<Idea> => {
    const currentIdeaCount = await ideaRepository.countByUserId(input.userId)

    await subscriptionService.assertCanCreateBusinessIdea(input.userId, currentIdeaCount)

    return ideaRepository.create({
      userId: input.userId,
      title: input.title,
      description: input.description
    })
  }
}
