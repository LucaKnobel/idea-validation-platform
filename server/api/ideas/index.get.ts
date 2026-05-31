import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  GetIdeasQuerySchema,
  IdeasListResponseSchema,
  type IdeasListResponseDto
} from '@infrastructure/validation/idea-schemas'
import { getIdeas } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { getLatestIdeaVersion } from '@application/models/idea'

/**
 * Returns a paginated list of ideas for the authenticated user.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeasListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.list',
    maxRequests: 50,
    windowSeconds: 60,
    scope: 'user'
  })

  const query = await getValidatedQuery(event, GetIdeasQuerySchema.parse)

  const result = await getIdeas({
    userId,
    search: query.q ?? null,
    page: query.page,
    pageSize: query.pageSize
  })

  return IdeasListResponseSchema.parse({
    items: result.ideas.map((idea) => {
      const latestVersion = getLatestIdeaVersion(idea)

      return {
        id: idea.id,
        latestVersionId: latestVersion.id,
        title: latestVersion.title,
        description: latestVersion.description,
        createdAt: idea.createdAt.toISOString(),
        updatedAt: idea.updatedAt.toISOString()
      }
    }),
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
    q: result.search
  })
})
