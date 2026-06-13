import * as z from 'zod'
import { canvasElementTypes } from '@application/models/canvas-element'
import {
  hypothesisDimensions,
  hypothesisEvidenceTypes,
  hypothesisPriorities,
  hypothesisStatuses
} from '@application/models/hypothesis'

export const HypothesisDimensionSchema = z.enum(hypothesisDimensions)

export const HypothesisPrioritySchema = z.enum(hypothesisPriorities)

export const HypothesisEvidenceTypeSchema = z.enum(hypothesisEvidenceTypes)

export const HypothesisStatusSchema = z.enum(hypothesisStatuses)

export const HypothesisCanvasElementTypeSchema = z.enum(canvasElementTypes)

export const UpsertHypothesisBodySchema = z.object({
  statement: z.string().trim().min(1, 'Hypothesis statement is required')
    .max(3000, 'Hypothesis statement is too long'),
  dimension: HypothesisDimensionSchema,
  priority: HypothesisPrioritySchema,
  evidenceType: HypothesisEvidenceTypeSchema,
  canvasElementTypes: z.array(HypothesisCanvasElementTypeSchema)
    .min(1, 'At least one canvas section link is required')
    .max(9, 'Too many canvas section links')
})

export const HypothesisResponseSchema = z.object({
  id: z.uuid(),
  ideaVersionId: z.uuid(),
  statement: z.string(),
  dimension: HypothesisDimensionSchema,
  priority: HypothesisPrioritySchema,
  evidenceType: HypothesisEvidenceTypeSchema,
  status: HypothesisStatusSchema,
  canvasSections: z.array(HypothesisCanvasElementTypeSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const HypothesesListResponseSchema = z.object({
  items: z.array(HypothesisResponseSchema)
})

export type UpsertHypothesisBodyDto = z.infer<typeof UpsertHypothesisBodySchema>
export type HypothesisResponseDto = z.infer<typeof HypothesisResponseSchema>
export type HypothesesListResponseDto = z.infer<typeof HypothesesListResponseSchema>
