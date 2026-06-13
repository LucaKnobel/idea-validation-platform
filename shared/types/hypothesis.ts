import type { UpsertHypothesisBodyDto } from '@infrastructure/validation/hypothesis-schemas'

export type {
  UpsertHypothesisBodyDto,
  HypothesisResponseDto,
  HypothesesListResponseDto
} from '@infrastructure/validation/hypothesis-schemas'

export type HypothesisDimension = UpsertHypothesisBodyDto['dimension']
export type HypothesisPriority = UpsertHypothesisBodyDto['priority']
export type HypothesisCanvasSection = UpsertHypothesisBodyDto['canvasElementTypes'][number]
