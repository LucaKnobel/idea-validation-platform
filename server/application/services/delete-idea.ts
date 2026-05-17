import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Logger } from '@interfaces/logger'
import { IdeaNotFoundError } from '@application/errors/idea-errors'

/**
 * Builds the use case that deletes an idea owned by the current user.
 */
export const createDeleteIdea = (ideaRepository: IdeaRepository, logger: Logger) => {
  return async (input: { userId: string, ideaId: string }): Promise<void> => {
    const deleted = await ideaRepository.deleteByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId
    })

    if (!deleted) {
      throw new IdeaNotFoundError()
    }

    logger.debug('Idea deleted', { userId: input.userId, ideaId: input.ideaId })
  }
}
