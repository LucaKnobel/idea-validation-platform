import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis } from '@application/models/hypothesis'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type GetHypothesisInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that loads one owned hypothesis.
 */
export const buildGetHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: GetHypothesisInput): Promise<Hypothesis> => {
    const hypothesis = await hypothesisRepository.getById({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (hypothesis === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis loaded', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    return hypothesis
  }
}
