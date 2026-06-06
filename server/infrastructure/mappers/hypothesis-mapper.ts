import type { Hypothesis } from '@application/models/hypothesis'
import type { HypothesisCanvasSection } from '@application/models/hypothesis-canvas-section'
import {
  HypothesisCanvasSectionResponseSchema,
  HypothesisResponseSchema,
  HypothesesListResponseSchema,
  type HypothesisCanvasSectionResponseDto,
  type HypothesisResponseDto,
  type HypothesesListResponseDto
} from '@infrastructure/validation/hypothesis-schemas'

/**
 * Maps one hypothesis-canvas link to the public API response DTO.
 */
export const toHypothesisCanvasSectionResponseDto = (section: HypothesisCanvasSection): HypothesisCanvasSectionResponseDto => {
  return HypothesisCanvasSectionResponseSchema.parse({
    id: section.id,
    hypothesisId: section.hypothesisId,
    canvasElementType: section.canvasElementType,
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString()
  })
}

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
    canvasSectionLinks: hypothesis.canvasSectionLinks.map(toHypothesisCanvasSectionResponseDto),
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
