import { enforceRateLimit } from '@server/infrastructure/rate-limit/enforce-rate-limit'
import { CreateIdeaBodySchema, IdeaResponseSchema, type IdeaResponseDto } from '@infrastructure/validation/idea-schemas'
import { requireAuthenticatedUserId } from '../../infrastructure/auth/require-authenticated-user'
import { createIdea } from '@infrastructure/composition'

export default defineEventHandler(async (event): Promise<IdeaResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.create',
    maxRequests: 10,
    windowSeconds: 60,
    scope: 'user'
  })

  const userId = await requireAuthenticatedUserId(event)

  const body = await readValidatedBody(event, CreateIdeaBodySchema.parse)

  const createdIdea = await createIdea({
    userId,
    title: body.title,
    description: body.description && body.description.length > 0 ? body.description : null
  })

  return IdeaResponseSchema.parse({
    id: createdIdea.id,
    title: createdIdea.title,
    description: createdIdea.description,
    createdAt: createdIdea.createdAt.toISOString(),
    updatedAt: createdIdea.updatedAt.toISOString()
  })
})
