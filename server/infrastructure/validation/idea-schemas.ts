import * as z from 'zod'

export const CreateIdeaBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(3000, 'Description is too long').optional()
})

export const IdeaResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export type CreateIdeaBodyDto = z.infer<typeof CreateIdeaBodySchema>
export type IdeaResponseDto = z.infer<typeof IdeaResponseSchema>
