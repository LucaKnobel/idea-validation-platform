import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  HypothesisResponseSchema,
  HypothesesListResponseSchema,
  HypothesisVersionRouteParamsSchema,
  type HypothesesListResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { getIdeaVersionHypotheses } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns all hypotheses for a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesesListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisVersionRouteParamsSchema.parse)

  const hypotheses = await getIdeaVersionHypotheses({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId
  })

  return HypothesesListResponseSchema.parse({
    items: hypotheses.map(hypothesis => HypothesisResponseSchema.parse({
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
    }))
  })
})
