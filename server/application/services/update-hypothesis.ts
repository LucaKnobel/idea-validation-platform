import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis, HypothesisDimension, HypothesisPriority } from '@application/models/hypothesis'
import { uniqueCanvasSectionTypes } from '@application/models/hypothesis-canvas-section'
import type { CanvasElementType } from '@application/models/canvas-element'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type UpdateHypothesisInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  canvasSectionTypes: CanvasElementType[]
}

/**
 * Builds the use case that updates one hypothesis and replaces its canvas section assignments.
 */
export const createUpdateHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: UpdateHypothesisInput): Promise<Hypothesis> => {
    const hypothesis = await hypothesisRepository.updateByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      statement: input.statement.trim(),
      dimension: input.dimension,
      priority: input.priority,
      canvasSectionTypes: uniqueCanvasSectionTypes(input.canvasSectionTypes)
    })

    if (hypothesis === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis updated', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })

    return hypothesis
  }
}
