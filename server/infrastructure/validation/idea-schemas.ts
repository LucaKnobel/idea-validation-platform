import * as z from 'zod'

export const CreateIdeaBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(3000, 'Description is too long').optional()
})

/**
 * Request body for updating title and description of one idea version.
 */
export const UpdateIdeaVersionBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(3000, 'Description is too long').optional()
})

export const GetIdeasQuerySchema = z.object({
  q: z.string().trim().max(200, 'Search query is too long').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
})

export const IdeaResponseSchema = z.object({
  id: z.uuid(),
  latestVersionId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

/**
 * Request body for deriving a new version from an existing base version.
 */
export const CreateIdeaVersionBodySchema = z.object({
  baseVersionId: z.uuid(),
  type: z.enum(['ITERATION', 'PIVOT'])
})

/**
 * Public metadata for one idea version used by overview and history UIs.
 */
export const IdeaVersionMetadataSchema = z.object({
  id: z.uuid(),
  versionNumber: z.number().int().min(1),
  type: z.enum(['INITIAL', 'ITERATION', 'PIVOT']),
  parentVersionId: z.uuid().nullable(),
  parentVersionNumber: z.number().int().min(1).nullable(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

/**
 * Idea detail payload with the latest version pointer and full version metadata list.
 */
export const IdeaDetailResponseSchema = z.object({
  id: z.uuid(),
  latestVersionId: z.uuid(),
  latestVersionNumber: z.number().int().min(1),
  versions: z.array(IdeaVersionMetadataSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

/**
 * Compact list payload for all versions that belong to one idea.
 */
export const IdeaVersionsListResponseSchema = z.object({
  items: z.array(IdeaVersionMetadataSchema)
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
export type CreateIdeaVersionBodyDto = z.infer<typeof CreateIdeaVersionBodySchema>
export type UpdateIdeaVersionBodyDto = z.infer<typeof UpdateIdeaVersionBodySchema>
export type GetIdeasQueryDto = z.infer<typeof GetIdeasQuerySchema>
export type IdeaResponseDto = z.infer<typeof IdeaResponseSchema>
export type IdeasListResponseDto = z.infer<typeof IdeasListResponseSchema>
export type IdeaVersionMetadataDto = z.infer<typeof IdeaVersionMetadataSchema>
export type IdeaDetailResponseDto = z.infer<typeof IdeaDetailResponseSchema>
export type IdeaVersionsListResponseDto = z.infer<typeof IdeaVersionsListResponseSchema>
