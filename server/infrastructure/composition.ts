import { ideaRepository } from '@infrastructure/db/repositories/prisma-idea-repository'
import { subscriptionRepository } from '@infrastructure/db/repositories/prisma-subscription-repository'
import { logger } from '@infrastructure/logging/logger'

import { createSubscriptionService } from '@application/services/subscription-service'
import { createCreateIdea } from '@application/services/create-idea'
import { createGetIdeas } from '@application/services/get-ideas'
import { createDeleteIdea } from '@application/services/delete-idea'

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
  ideaRepository,
  logger
)

const deleteIdea = createDeleteIdea(
  ideaRepository,
  logger
)

export {
  subscriptionService,
  createIdea,
  getIdeas,
  deleteIdea
}
