import * as z from 'zod'
import { canvasElementTypes } from '@application/models/canvas-element'
import { hypothesisDimensions, hypothesisPriorities } from '@application/models/hypothesis'

export const HypothesisVersionRouteParamsSchema = z.object({
  id: z.uuid(),
  versionId: z.uuid()
})

export const HypothesisRouteParamsSchema = HypothesisVersionRouteParamsSchema.extend({
  hypothesisId: z.uuid()
})

export const HypothesisDimensionSchema = z.enum(hypothesisDimensions)

export const HypothesisPrioritySchema = z.enum(hypothesisPriorities)

export const HypothesisCanvasElementTypeSchema = z.enum(canvasElementTypes)

export const UpsertHypothesisBodySchema = z.object({
  statement: z.string().trim().min(1, 'Hypothesis statement is required')
    .max(3000, 'Hypothesis statement is too long'),
  dimension: HypothesisDimensionSchema,
  priority: HypothesisPrioritySchema,
  canvasSectionTypes: z.array(HypothesisCanvasElementTypeSchema)
    .min(1, 'At least one canvas section link is required')
    .max(9, 'Too many canvas section links')
})

export const CreateHypothesisBodySchema = UpsertHypothesisBodySchema

export const UpdateHypothesisBodySchema = UpsertHypothesisBodySchema

export const HypothesisCanvasSectionResponseSchema = z.object({
  id: z.uuid(),
  hypothesisId: z.uuid(),
  canvasElementType: HypothesisCanvasElementTypeSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const HypothesisResponseSchema = z.object({
  id: z.uuid(),
  ideaVersionId: z.uuid(),
  statement: z.string(),
  dimension: HypothesisDimensionSchema,
  priority: HypothesisPrioritySchema,
  canvasSectionLinks: z.array(HypothesisCanvasSectionResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const HypothesesListResponseSchema = z.object({
  items: z.array(HypothesisResponseSchema)
})

export type HypothesisVersionRouteParamsDto = z.infer<typeof HypothesisVersionRouteParamsSchema>
export type HypothesisRouteParamsDto = z.infer<typeof HypothesisRouteParamsSchema>
export type CreateHypothesisBodyDto = z.infer<typeof CreateHypothesisBodySchema>
export type UpdateHypothesisBodyDto = z.infer<typeof UpdateHypothesisBodySchema>
export type HypothesisCanvasSectionResponseDto = z.infer<typeof HypothesisCanvasSectionResponseSchema>
export type HypothesisResponseDto = z.infer<typeof HypothesisResponseSchema>
export type HypothesesListResponseDto = z.infer<typeof HypothesesListResponseSchema>
