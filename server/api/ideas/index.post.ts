import { enforceRateLimit } from '@server/infrastructure/rate-limit/enforce-rate-limit'
import { CreateIdeaBodySchema, type IdeaResponseDto } from '@infrastructure/validation/idea-schemas'
import { createIdea } from '@infrastructure/composition'
import { toIdeaResponseDto } from '@infrastructure/mappers/idea-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

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

  setResponseStatus(event, 201)
  return toIdeaResponseDto(createdIdea)
})
