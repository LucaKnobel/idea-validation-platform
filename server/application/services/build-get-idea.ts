import { IdeaNotFoundError } from '@application/errors/idea-errors'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Idea } from '@application/models/idea'
import type { Logger } from '@interfaces/logger'

export type GetIdeaInput = {
  userId: string
  ideaId: string
}

/**
 * Builds the use case that returns one owned idea with all versions.
 */
export const buildGetIdea = (ideaVersionRepository: IdeaVersionRepository, logger: Logger) => {
  return async (input: GetIdeaInput): Promise<Idea> => {
    const idea = await ideaVersionRepository.getByIdea({
      userId: input.userId,
      ideaId: input.ideaId
    })

    if (idea === null) {
      throw new IdeaNotFoundError()
    }

    logger.debug('Idea loaded', {
      userId: input.userId,
      ideaId: input.ideaId,
      versions: idea.versions.length
    })

    return idea
  }
}
