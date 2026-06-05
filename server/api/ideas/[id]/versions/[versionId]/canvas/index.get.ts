import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CanvasRouteParamsSchema,
  IdeaVersionCanvasResponseSchema,
  type IdeaVersionCanvasResponseDto
} from '@infrastructure/validation/canvas-schemas'
import { getIdeaVersionCanvas } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns all canvas entries for a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaVersionCanvasResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.canvas.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, CanvasRouteParamsSchema.parse)

  const canvasElements = await getIdeaVersionCanvas({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId
  })

  return IdeaVersionCanvasResponseSchema.parse({
    elements: canvasElements.map(element => ({
      id: element.id,
      ideaVersionId: element.ideaVersionId,
      type: element.type,
      content: element.content,
      createdAt: element.createdAt.toISOString(),
      updatedAt: element.updatedAt.toISOString()
    }))
  })
})
