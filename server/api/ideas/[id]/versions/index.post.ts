import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { IdeaIdParamsSchema } from '@infrastructure/validation/route-params-schemas'
import {
  CreateIdeaVersionBodySchema,
  type IdeaVersionMetadataDto
} from '@infrastructure/validation/idea-schemas'
import { createIdeaVersion } from '@infrastructure/composition'
import { toIdeaVersionMetadataResponseDto } from '@infrastructure/mappers/idea-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Creates one new ITERATION or PIVOT version from a selected base version.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaVersionMetadataDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.versions.create',
    maxRequests: 20,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaIdParamsSchema.parse)
  const body = await readValidatedBody(event, CreateIdeaVersionBodySchema.parse)

  const createdVersion = await createIdeaVersion({
    userId,
    ideaId: params.id,
    baseVersionId: body.baseVersionId,
    type: body.type
  })

  setResponseStatus(event, 201)

  return toIdeaVersionMetadataResponseDto(createdVersion)
})
