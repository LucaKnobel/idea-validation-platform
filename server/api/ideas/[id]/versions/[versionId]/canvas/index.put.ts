import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  ReplaceIdeaVersionCanvasBodySchema,
  type IdeaVersionCanvasResponseDto
} from '@infrastructure/validation/canvas-schemas'
import { IdeaVersionRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import { replaceIdeaVersionCanvas } from '@infrastructure/composition'
import { toIdeaVersionCanvasResponseDto } from '@infrastructure/mappers/canvas-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Replaces the complete canvas snapshot for a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<IdeaVersionCanvasResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.canvas.replace',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaVersionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, ReplaceIdeaVersionCanvasBodySchema.parse)

  const canvasElements = await replaceIdeaVersionCanvas({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    elements: body.elements
  })

  return toIdeaVersionCanvasResponseDto(canvasElements)
})
