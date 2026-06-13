import type { Hypothesis } from '@application/models/hypothesis'
import {
  HypothesisResponseSchema,
  HypothesesListResponseSchema,
  type HypothesisResponseDto,
  type HypothesesListResponseDto
} from '@infrastructure/validation/hypothesis-schemas'

/**
 * Maps one hypothesis aggregate to the public API response DTO.
 */
export const toHypothesisResponseDto = (hypothesis: Hypothesis): HypothesisResponseDto => {
  return HypothesisResponseSchema.parse({
    id: hypothesis.id,
    ideaVersionId: hypothesis.ideaVersionId,
    statement: hypothesis.statement,
    dimension: hypothesis.dimension,
    priority: hypothesis.priority,
    evidenceType: hypothesis.evidenceType,
    status: hypothesis.status,
    canvasSections: hypothesis.canvasSectionLinks.map(section => section.canvasElementType),
    createdAt: hypothesis.createdAt.toISOString(),
    updatedAt: hypothesis.updatedAt.toISOString()
  })
}

/**
 * Maps a list of hypotheses to the public collection DTO.
 */
export const toHypothesesListResponseDto = (hypotheses: Hypothesis[]): HypothesesListResponseDto => {
  return HypothesesListResponseSchema.parse({
    items: hypotheses.map(toHypothesisResponseDto)
  })
}
