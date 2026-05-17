import { ideaRepository } from '@infrastructure/db/repositories/prisma-idea-repository'
import { subscriptionRepository } from '@infrastructure/db/repositories/prisma-subscription-repository'
import { logger } from '@infrastructure/logging/logger'

import { createSubscriptionService } from '@application/services/subscription-service'
import { createCreateIdea } from '@application/services/create-idea'

const subscriptionService = createSubscriptionService(
  subscriptionRepository,
  logger
)

const createIdea = createCreateIdea(
  ideaRepository,
  subscriptionService
)

export {
  subscriptionService,
  createIdea
}
