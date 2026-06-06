import type { CreateHypothesisBodyDto } from '@infrastructure/validation/hypothesis-schemas'

export type {
  CreateHypothesisBodyDto,
  UpdateHypothesisBodyDto,
  HypothesisCanvasSectionResponseDto,
  HypothesisResponseDto,
  HypothesesListResponseDto
} from '@infrastructure/validation/hypothesis-schemas'

export type HypothesisDimension = CreateHypothesisBodyDto['dimension']
export type HypothesisPriority = CreateHypothesisBodyDto['priority']
export type HypothesisCanvasSection = CreateHypothesisBodyDto['canvasSectionTypes'][number]
