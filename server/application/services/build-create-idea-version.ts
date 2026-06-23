import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type {
  CreateVersionType,
  IdeaVersionRepository
} from '@application/interfaces/idea-version-repository'
import type { IdeaVersion } from '@application/models/idea-version'
import type { Logger } from '@interfaces/logger'

export type CreateIdeaVersionInput = {
  userId: string
  ideaId: string
  baseVersionId: string
  type: CreateVersionType
}

/**
 * Builds the use case that derives one new idea version from a selected base version.
 */
export const buildCreateIdeaVersion = (ideaVersionRepository: IdeaVersionRepository, logger: Logger) => {
  return async (input: CreateIdeaVersionInput): Promise<IdeaVersion> => {
    const source = await ideaVersionRepository.getVersionSource({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.baseVersionId
    })

    if (source === null) {
      throw new IdeaVersionNotFoundError()
    }

    const hypothesisIdsToCopy = source.hypotheses
      .filter((hypothesis) => {
        if (input.type === 'ITERATION') {
          return true
        }
        // Pivot only copies hypotheses that are validated or not tested, but not invalidated ones.
        return hypothesis.status === 'VALIDATED' || hypothesis.status === 'NOT_TESTED'
      })
      .map(hypothesis => hypothesis.id)

    const createdVersion = await ideaVersionRepository.createFromSource({
      userId: input.userId,
      ideaId: input.ideaId,
      baseVersionId: input.baseVersionId,
      type: input.type,
      hypothesisIdsToCopy
    })

    if (createdVersion === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Idea version derived', {
      userId: input.userId,
      ideaId: input.ideaId,
      baseVersionId: input.baseVersionId,
      createdVersionId: createdVersion.id,
      type: input.type,
      copiedHypotheses: hypothesisIdsToCopy.length
    })

    return createdVersion
  }
}
