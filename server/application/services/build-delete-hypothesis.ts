import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type DeleteHypothesisInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that deletes one owned hypothesis.
 */
export const buildDeleteHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: DeleteHypothesisInput): Promise<void> => {
    const deleted = await hypothesisRepository.delete({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (!deleted) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis deleted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })
  }
}
