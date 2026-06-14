import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type {
  Hypothesis,
  HypothesisDimension,
  HypothesisEvidenceType,
  HypothesisPriority
} from '@application/models/hypothesis'
import type { CanvasElementType } from '@application/models/canvas-element'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type UpdateHypothesisInput = {
  userId: string
  hypothesisId: string
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  evidenceType: HypothesisEvidenceType
  canvasElementTypes: CanvasElementType[]
}

/**
 * Builds the use case that updates one owned hypothesis.
 */
export const buildUpdateHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: UpdateHypothesisInput): Promise<Hypothesis> => {
    const hypothesis = await hypothesisRepository.update({
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      statement: input.statement,
      dimension: input.dimension,
      priority: input.priority,
      evidenceType: input.evidenceType,
      canvasElementTypes: input.canvasElementTypes
    })

    if (hypothesis === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis updated', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    return hypothesis
  }
}
