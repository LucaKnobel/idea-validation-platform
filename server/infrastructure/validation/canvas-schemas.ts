import * as z from 'zod'
import { canvasElementTypes } from '@application/models/canvas-element'

export const CanvasRouteParamsSchema = z.object({
  id: z.uuid(),
  versionId: z.uuid()
})

export const CanvasElementTypeSchema = z.enum(canvasElementTypes)

export const CanvasElementInputSchema = z.object({
  type: CanvasElementTypeSchema,
  content: z.string().trim().min(1, 'Canvas content is required').max(5000, 'Canvas content is too long')
})

export const ReplaceIdeaVersionCanvasBodySchema = z.object({
  elements: z.array(CanvasElementInputSchema).max(500, 'Too many canvas elements')
})

export const CanvasElementResponseSchema = z.object({
  id: z.uuid(),
  ideaVersionId: z.uuid(),
  type: CanvasElementTypeSchema,
  content: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const IdeaVersionCanvasResponseSchema = z.object({
  elements: z.array(CanvasElementResponseSchema)
})

export type CanvasRouteParamsDto = z.infer<typeof CanvasRouteParamsSchema>
export type CanvasElementInputDto = z.infer<typeof CanvasElementInputSchema>
export type ReplaceIdeaVersionCanvasBodyDto = z.infer<typeof ReplaceIdeaVersionCanvasBodySchema>
export type CanvasElementResponseDto = z.infer<typeof CanvasElementResponseSchema>
export type IdeaVersionCanvasResponseDto = z.infer<typeof IdeaVersionCanvasResponseSchema>
