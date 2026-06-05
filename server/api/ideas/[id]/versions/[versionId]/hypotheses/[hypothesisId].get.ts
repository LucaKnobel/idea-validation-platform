import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  HypothesisResponseSchema,
  HypothesisRouteParamsSchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import type { HypothesisCanvasSection } from '@application/models/hypothesis-canvas-section'
import { getHypothesis } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns one hypothesis in a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisRouteParamsSchema.parse)

  const hypothesis = await getHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId
  })

  return HypothesisResponseSchema.parse({
    id: hypothesis.id,
    ideaVersionId: hypothesis.ideaVersionId,
    statement: hypothesis.statement,
    dimension: hypothesis.dimension,
    priority: hypothesis.priority,
    canvasSectionLinks: hypothesis.canvasSectionLinks.map((section: HypothesisCanvasSection) => ({
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
