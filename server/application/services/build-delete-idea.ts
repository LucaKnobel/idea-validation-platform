import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Logger } from '@interfaces/logger'
import { IdeaNotFoundError } from '@application/errors/idea-errors'

export type DeleteIdeaInput = {
  userId: string
  ideaId: string
}

/**
 * Builds the use case that deletes one owned idea.
 */
export const buildDeleteIdea = (ideaRepository: IdeaRepository, logger: Logger) => {
  return async (input: DeleteIdeaInput): Promise<void> => {
    const deleted = await ideaRepository.delete({
      userId: input.userId,
      ideaId: input.ideaId
    })

    if (!deleted) {
      throw new IdeaNotFoundError()
    }

    logger.debug('Idea deleted', { userId: input.userId, ideaId: input.ideaId })
  }
}
