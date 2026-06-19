import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { IdeaIdParamsSchema } from '@infrastructure/validation/route-params-schemas'
import type { IdeaDetailResponseDto } from '@infrastructure/validation/idea-schemas'
import { getIdea } from '@infrastructure/composition'
import { toIdeaDetailResponseDto } from '@infrastructure/mappers/idea-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns one owned idea with metadata and all versions.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaDetailResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaIdParamsSchema.parse)

  const idea = await getIdea({
    userId,
    ideaId: params.id
  })

  return toIdeaDetailResponseDto(idea)
})
