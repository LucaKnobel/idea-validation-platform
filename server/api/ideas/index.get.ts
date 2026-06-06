import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  GetIdeasQuerySchema,
  type IdeasListResponseDto
} from '@infrastructure/validation/idea-schemas'
import { getIdeas } from '@infrastructure/composition'
import { toIdeasListResponseDto } from '@infrastructure/mappers/idea-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

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

  return toIdeasListResponseDto(result)
})
