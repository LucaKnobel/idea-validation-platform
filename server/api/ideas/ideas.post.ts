import { enforceRateLimit } from '@server/api/rate-limit/enforce-rate-limit'
import { CreateIdeaBodySchema, IdeaResponseSchema, type IdeaResponseDto } from '@server/api/schemas/idea-schemas'
import { auth } from '@infrastructure/auth/auth'
import { createIdea } from '@infrastructure/composition'

export default defineEventHandler(async (event): Promise<IdeaResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.create',
    maxRequests: 10,
    windowSeconds: 60,
    scope: 'user'
  })

  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, CreateIdeaBodySchema.parse)

  const createdIdea = await createIdea({
    userId: session.user.id,
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
