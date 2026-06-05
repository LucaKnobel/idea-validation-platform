import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis } from '@application/models/hypothesis'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type GetHypothesisInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
}

/**
 * Builds the use case that loads one hypothesis for a specific idea version.
 */
export const createGetHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: GetHypothesisInput): Promise<Hypothesis> => {
    const hypothesis = await hypothesisRepository.getByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })

    if (hypothesis === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis loaded', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })

    return hypothesis
  }
}
