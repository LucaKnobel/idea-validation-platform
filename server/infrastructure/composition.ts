import { ideaRepository } from '@infrastructure/db/repositories/prisma-idea-repository'
import { ideaVersionRepository } from '@infrastructure/db/repositories/prisma-idea-version-repository'
import { canvasRepository } from '@infrastructure/db/repositories/prisma-canvas-repository'
import { hypothesisRepository } from '@infrastructure/db/repositories/prisma-hypothesis-repository'
import { subscriptionRepository } from '@infrastructure/db/repositories/prisma-subscription-repository'
import { logger } from '@infrastructure/logging/logger'

import { createSubscriptionService } from '@application/services/subscription-service'
import { createCreateIdea } from '@application/services/create-idea'
import { createGetIdeas } from '@application/services/get-ideas'
import { createDeleteIdea } from '@application/services/delete-idea'
import { createGetIdeaVersionCanvas } from '@application/services/get-idea-version-canvas'
import { createUpdateIdeaVersionCanvas } from '@application/services/update-idea-version-canvas'
import { createCreateHypothesis } from '@application/services/create-hypothesis'
import { createGetIdeaVersionHypotheses } from '@application/services/get-idea-version-hypotheses'
import { createUpdateHypothesis } from '@application/services/update-hypothesis'
import { createDeleteHypothesis } from '@application/services/delete-hypothesis'

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

const createHypothesis = createCreateHypothesis(
  hypothesisRepository,
  logger
)

const getIdeaVersionHypotheses = createGetIdeaVersionHypotheses(
  hypothesisRepository,
  logger
)

const updateHypothesis = createUpdateHypothesis(
  hypothesisRepository,
  logger
)

const deleteHypothesis = createDeleteHypothesis(
  hypothesisRepository,
  logger
)

export {
  subscriptionService,
  createIdea,
  getIdeas,
  deleteIdea,
  getIdeaVersionCanvas,
  updateIdeaVersionCanvas,
  createHypothesis,
  getIdeaVersionHypotheses,
  updateHypothesis,
  deleteHypothesis
}
