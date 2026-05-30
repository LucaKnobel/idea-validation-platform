import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type DeleteHypothesisInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
}

/**
 * Builds the use case that deletes one hypothesis owned by the current user.
 */
export const createDeleteHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: DeleteHypothesisInput): Promise<void> => {
    const deleted = await hypothesisRepository.deleteByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })

    if (!deleted) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis deleted', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })
  }
}
