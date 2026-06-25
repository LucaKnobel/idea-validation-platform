import * as z from 'zod'

export const GetContentParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required')
})

export const GetContentQuerySchema = z.object({
  locale: z.enum(['de', 'en']).optional()
})

export type GetContentParamsDto = z.infer<typeof GetContentParamsSchema>
export type GetContentQueryDto = z.infer<typeof GetContentQuerySchema>
