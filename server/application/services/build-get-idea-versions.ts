import { IdeaNotFoundError } from '@application/errors/idea-errors'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { IdeaVersion } from '@application/models/idea-version'
import type { Logger } from '@interfaces/logger'

export type GetIdeaVersionsInput = {
  userId: string
  ideaId: string
}

/**
 * Builds the use case that lists all versions of one owned idea.
 */
export const buildGetIdeaVersions = (ideaVersionRepository: IdeaVersionRepository, logger: Logger) => {
  return async (input: GetIdeaVersionsInput): Promise<IdeaVersion[]> => {
    const versions = await ideaVersionRepository.listByIdea({
      userId: input.userId,
      ideaId: input.ideaId
    })

    if (versions === null) {
      throw new IdeaNotFoundError()
    }

    logger.debug('Idea versions listed', {
      userId: input.userId,
      ideaId: input.ideaId,
      items: versions.length
    })

    return versions
  }
}
