import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis } from '@application/models/hypothesis'
import type { Logger } from '@interfaces/logger'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'

export type GetIdeaVersionHypothesesInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

/**
 * Builds the use case that lists all hypotheses in one specific idea version.
 */
export const createGetIdeaVersionHypotheses = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: GetIdeaVersionHypothesesInput): Promise<Hypothesis[]> => {
    const hypotheses = await hypothesisRepository.listByIdeaVersionForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId
    })

    if (hypotheses === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Hypotheses listed', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      items: hypotheses.length
    })

    return hypotheses
  }
}
