import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { IdeaVersion } from '@application/models/idea-version'
import type { Logger } from '@interfaces/logger'

export type UpdateIdeaVersionInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  title: string
  description: string | null
}

/**
 * Builds the use case that updates metadata for one owned idea version.
 */
export const buildUpdateIdeaVersion = (ideaVersionRepository: IdeaVersionRepository, logger: Logger) => {
  return async (input: UpdateIdeaVersionInput): Promise<IdeaVersion> => {
    const updatedVersion = await ideaVersionRepository.updateMetadata({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      title: input.title,
      description: input.description
    })

    if (updatedVersion === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Idea version metadata updated', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId
    })

    return updatedVersion
  }
}
