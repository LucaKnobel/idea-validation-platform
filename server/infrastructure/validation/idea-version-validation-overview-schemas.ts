import * as z from 'zod'
import { hypothesisDimensions } from '@application/models/hypothesis'

const ValidationStatusCountsSchema = z.object({
  validated: z.number().int().nonnegative(),
  invalidated: z.number().int().nonnegative(),
  notTested: z.number().int().nonnegative()
})

const ValidationPriorityCountsSchema = z.object({
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative()
})

const ValidationEvidenceCountsSchema = z.object({
  qualitative: z.number().int().nonnegative(),
  quantitative: z.number().int().nonnegative(),
  behavioral: z.number().int().nonnegative(),
  monetary: z.number().int().nonnegative()
})

const ValidationDimensionCardSchema = z.object({
  dimension: z.enum(hypothesisDimensions),
  statusCounts: ValidationStatusCountsSchema,
  priorityCounts: ValidationPriorityCountsSchema,
  evidenceCounts: ValidationEvidenceCountsSchema
})

export const IdeaVersionValidationOverviewResponseSchema = z.object({
  ideaId: z.uuid(),
  ideaVersionId: z.uuid(),
  totalHypotheses: z.number().int().nonnegative(),
  statusCounts: ValidationStatusCountsSchema,
  priorityCounts: ValidationPriorityCountsSchema,
  evidenceCounts: ValidationEvidenceCountsSchema,
  dimensionCards: z.array(ValidationDimensionCardSchema)
})

export type IdeaVersionValidationOverviewResponseDto = z.infer<typeof IdeaVersionValidationOverviewResponseSchema>
