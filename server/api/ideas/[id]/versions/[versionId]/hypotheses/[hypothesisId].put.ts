import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  HypothesisResponseSchema,
  HypothesisRouteParamsSchema,
  UpdateHypothesisBodySchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { updateHypothesis } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Updates one hypothesis in a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.update',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpdateHypothesisBodySchema.parse)

  const hypothesis = await updateHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    statement: body.statement,
    dimension: body.dimension,
    priority: body.priority,
    canvasSectionTypes: body.canvasSectionTypes
  })

  return HypothesisResponseSchema.parse({
    id: hypothesis.id,
    ideaVersionId: hypothesis.ideaVersionId,
    statement: hypothesis.statement,
    dimension: hypothesis.dimension,
    priority: hypothesis.priority,
    canvasSectionLinks: hypothesis.canvasSectionLinks.map(section => ({
      id: section.id,
      hypothesisId: section.hypothesisId,
      canvasElementType: section.canvasElementType,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString()
    })),
    createdAt: hypothesis.createdAt.toISOString(),
    updatedAt: hypothesis.updatedAt.toISOString()
  })
})
