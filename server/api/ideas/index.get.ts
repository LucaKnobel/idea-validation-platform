import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  GetIdeasQuerySchema,
  IdeasListResponseSchema,
  type IdeasListResponseDto
} from '@infrastructure/validation/idea-schemas'
import { getIdeas } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

export default defineProtectedHandler(async (event, userId): Promise<IdeasListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.list',
    maxRequests: 30,
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
    items: result.ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString()
    })),
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
    q: result.search
  })
})
