import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { IdeaIdParamsSchema } from '@infrastructure/validation/route-params-schemas'
import type { IdeaVersionsListResponseDto } from '@infrastructure/validation/idea-schemas'
import { getIdeaVersions } from '@infrastructure/composition'
import { toIdeaVersionsListResponseDto } from '@infrastructure/mappers/idea-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Lists all versions for one owned idea.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaVersionsListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.versions.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaIdParamsSchema.parse)

  const versions = await getIdeaVersions({
    userId,
    ideaId: params.id
  })

  return toIdeaVersionsListResponseDto(versions)
})
