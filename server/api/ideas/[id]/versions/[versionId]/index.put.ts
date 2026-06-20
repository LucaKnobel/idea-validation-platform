import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { updateIdeaVersion } from '@infrastructure/composition'
import { toIdeaVersionMetadataResponseDto } from '@infrastructure/mappers/idea-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import {
  UpdateIdeaVersionBodySchema,
  type IdeaVersionMetadataDto
} from '@infrastructure/validation/idea-schemas'
import { IdeaVersionRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Updates metadata (title, description) for one owned idea version.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaVersionMetadataDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.versions.update',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaVersionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpdateIdeaVersionBodySchema.parse)

  const updatedVersion = await updateIdeaVersion({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    title: body.title,
    description: body.description && body.description.length > 0 ? body.description : null
  })

  return toIdeaVersionMetadataResponseDto(updatedVersion)
})
