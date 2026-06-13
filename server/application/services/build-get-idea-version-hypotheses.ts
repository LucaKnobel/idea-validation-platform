import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis } from '@application/models/hypothesis'
import type { Logger } from '@interfaces/logger'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'

export type ListIdeaVersionHypothesesInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

/**
 * Builds the use case that lists hypotheses for one owned idea version.
 */
export const buildGetIdeaVersionHypotheses = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: ListIdeaVersionHypothesesInput): Promise<Hypothesis[]> => {
    const hypotheses = await hypothesisRepository.listByIdeaVersion({
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
