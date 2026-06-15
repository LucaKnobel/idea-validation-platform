import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { getIdeaVersionValidationOverview } from '@infrastructure/composition'
import { IdeaVersionRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import type { IdeaVersionValidationOverviewResponseDto } from '@infrastructure/validation/idea-version-validation-overview-schemas'
import { toIdeaVersionValidationOverviewResponseDto } from '@infrastructure/mappers/idea-version-validation-overview-mapper'

/**
 * Returns validation aggregates for one owned idea version.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaVersionValidationOverviewResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.validation.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaVersionRouteParamsSchema.parse)

  const overview = await getIdeaVersionValidationOverview.getOverview({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId
  })

  return toIdeaVersionValidationOverviewResponseDto(overview)
})
