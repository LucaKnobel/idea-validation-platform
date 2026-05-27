import { enforceRateLimit } from '@server/infrastructure/rate-limit/enforce-rate-limit'
import { CreateIdeaBodySchema, IdeaResponseSchema, type IdeaResponseDto } from '@infrastructure/validation/idea-schemas'
import { createIdea } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { getLatestIdeaVersion } from '@application/models/idea'

/**
 * Creates a new idea for the authenticated user.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.create',
    maxRequests: 10,
    windowSeconds: 60,
    scope: 'user'
  })

  const body = await readValidatedBody(event, CreateIdeaBodySchema.parse)

  const createdIdea = await createIdea({
    userId,
    title: body.title,
    description: body.description && body.description.length > 0 ? body.description : null
  })

  const latestVersion = getLatestIdeaVersion(createdIdea)
  setResponseStatus(event, 201)
  return IdeaResponseSchema.parse({
    id: createdIdea.id,
    title: latestVersion.title,
    description: latestVersion.description,
    createdAt: createdIdea.createdAt.toISOString(),
    updatedAt: createdIdea.updatedAt.toISOString()
  })
})
