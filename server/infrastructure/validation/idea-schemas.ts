import * as z from 'zod'

export const CreateIdeaBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(3000, 'Description is too long').optional()
})

export const GetIdeasQuerySchema = z.object({
  q: z.string().trim().max(200, 'Search query is too long').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
})

export const IdeaRouteParamsSchema = z.object({
  id: z.uuid()
})

export const IdeaResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const IdeasListResponseSchema = z.object({
  items: z.array(IdeaResponseSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  q: z.string().nullable()
})

export type CreateIdeaBodyDto = z.infer<typeof CreateIdeaBodySchema>
export type GetIdeasQueryDto = z.infer<typeof GetIdeasQuerySchema>
export type IdeaRouteParamsDto = z.infer<typeof IdeaRouteParamsSchema>
export type IdeaResponseDto = z.infer<typeof IdeaResponseSchema>
export type IdeasListResponseDto = z.infer<typeof IdeasListResponseSchema>
