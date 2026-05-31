import * as z from 'zod'

export const GetContentParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required')
})

export type GetContentParamsDto = z.infer<typeof GetContentParamsSchema>
