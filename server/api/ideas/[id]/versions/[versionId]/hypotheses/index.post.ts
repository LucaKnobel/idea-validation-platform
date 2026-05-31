import { setResponseStatus } from 'h3'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateHypothesisBodySchema,
  HypothesisResponseSchema,
  HypothesisVersionRouteParamsSchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { createHypothesis } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Creates one hypothesis in a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisVersionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, CreateHypothesisBodySchema.parse)

  const hypothesis = await createHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    statement: body.statement,
    dimension: body.dimension,
    priority: body.priority,
    canvasSectionTypes: body.canvasSectionTypes
  })

  setResponseStatus(event, 201)

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
