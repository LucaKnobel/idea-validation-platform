import { ideaRepository } from '@infrastructure/db/repositories/prisma-idea-repository'
import { ideaVersionRepository } from '@infrastructure/db/repositories/prisma-idea-version-repository'
import { canvasRepository } from '@infrastructure/db/repositories/prisma-canvas-repository'
import { subscriptionRepository } from '@infrastructure/db/repositories/prisma-subscription-repository'
import { logger } from '@infrastructure/logging/logger'

import { createSubscriptionService } from '@application/services/subscription-service'
import { createCreateIdea } from '@application/services/create-idea'
import { createGetIdeas } from '@application/services/get-ideas'
import { createDeleteIdea } from '@application/services/delete-idea'
import { createGetIdeaVersionCanvas } from '@application/services/get-idea-version-canvas'
import { createUpdateIdeaVersionCanvas } from '@application/services/update-idea-version-canvas'

/**
 * Central composition root for wiring repositories, infrastructure adapters, and use cases.
 */
const subscriptionService = createSubscriptionService(
  subscriptionRepository,
  logger
)

const createIdea = createCreateIdea(
  ideaRepository,
  subscriptionService,
  logger
)

const getIdeas = createGetIdeas(
  ideaVersionRepository,
  logger
)

const deleteIdea = createDeleteIdea(
  ideaRepository,
  logger
)

const getIdeaVersionCanvas = createGetIdeaVersionCanvas(
  canvasRepository,
  logger
)

const updateIdeaVersionCanvas = createUpdateIdeaVersionCanvas(
  canvasRepository,
  logger
)

export {
  subscriptionService,
  createIdea,
  getIdeas,
  deleteIdea,
  getIdeaVersionCanvas,
  updateIdeaVersionCanvas
}
