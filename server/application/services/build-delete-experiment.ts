import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import type { Logger } from '@interfaces/logger'

export type DeleteExperimentInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that deletes the experiment singleton for one owned hypothesis.
 */
export const buildDeleteExperiment = (
  experimentRepository: ExperimentRepository,
  hypothesisStatusSyncService: HypothesisStatusSyncService,
  logger: Logger
) => {
  return async (input: DeleteExperimentInput): Promise<void> => {
    const deleted = await experimentRepository.deleteByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (!deleted) {
      throw new ExperimentNotFoundError()
    }

    await hypothesisStatusSyncService.sync({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    logger.debug('Experiment deleted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })
  }
}
