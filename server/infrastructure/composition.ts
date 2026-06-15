import { ideaRepository } from '@infrastructure/db/repositories/prisma-idea-repository'
import { ideaVersionRepository } from '@infrastructure/db/repositories/prisma-idea-version-repository'
import { canvasRepository } from '@infrastructure/db/repositories/prisma-canvas-repository'
import { hypothesisRepository } from '@infrastructure/db/repositories/prisma-hypothesis-repository'
import { experimentRepository } from '@infrastructure/db/repositories/prisma-experiment-repository'
import { metricRepository } from '@infrastructure/db/repositories/prisma-metric-repository'
import { measurementRepository } from '@infrastructure/db/repositories/prisma-measurement-repository'
import { subscriptionRepository } from '@infrastructure/db/repositories/prisma-subscription-repository'
import { logger } from '@infrastructure/logging/logger'

import { buildSubscriptionService } from '@application/services/build-subscription-service'
import { buildCreateIdea } from '@application/services/build-create-idea'
import { buildGetIdeas } from '@application/services/build-get-ideas'
import { buildDeleteIdea } from '@application/services/build-delete-idea'
import { buildGetIdeaVersionCanvas } from '@application/services/build-get-idea-version-canvas'
import { buildReplaceIdeaVersionCanvas } from '@application/services/build-replace-idea-version-canvas'
import { buildCreateHypothesis } from '@application/services/build-create-hypothesis'
import { buildGetIdeaVersionHypotheses } from '@application/services/build-get-idea-version-hypotheses'
import { buildGetHypothesis } from '@application/services/build-get-hypothesis'
import { buildUpdateHypothesis } from '@application/services/build-update-hypothesis'
import { buildDeleteHypothesis } from '@application/services/build-delete-hypothesis'
import { buildGetHypothesisMetric } from '@application/services/build-get-hypothesis-metric'
import { buildUpsertMetric } from '@application/services/build-upsert-metric'
import { buildDeleteMetric } from '@application/services/build-delete-metric'
import { buildGetHypothesisExperiment } from '@application/services/build-get-hypothesis-experiment'
import { buildUpsertExperiment } from '@application/services/build-upsert-experiment'
import { buildDeleteExperiment } from '@application/services/build-delete-experiment'
import { buildGetHypothesisMeasurement } from '@application/services/build-get-hypothesis-measurement'
import { buildUpsertMeasurement } from '@application/services/build-upsert-measurement'
import { buildDeleteMeasurement } from '@application/services/build-delete-measurement'
import { buildSyncHypothesisStatus } from '@application/services/build-sync-hypothesis-status'

/**
 * Central composition root for wiring repositories, infrastructure adapters, and use cases.
 */
const subscriptionService = buildSubscriptionService(
  subscriptionRepository,
  logger
)

const createIdea = buildCreateIdea(
  ideaRepository,
  subscriptionService,
  logger
)

const getIdeas = buildGetIdeas(
  ideaVersionRepository,
  logger
)

const deleteIdea = buildDeleteIdea(
  ideaRepository,
  logger
)

const getIdeaVersionCanvas = buildGetIdeaVersionCanvas(
  canvasRepository,
  logger
)

const replaceIdeaVersionCanvas = buildReplaceIdeaVersionCanvas(
  canvasRepository,
  logger
)

const createHypothesis = buildCreateHypothesis(
  hypothesisRepository,
  logger
)

const getIdeaVersionHypotheses = buildGetIdeaVersionHypotheses(
  hypothesisRepository,
  logger
)

const getHypothesis = buildGetHypothesis(
  hypothesisRepository,
  logger
)

const updateHypothesis = buildUpdateHypothesis(
  hypothesisRepository,
  logger
)

const deleteHypothesis = buildDeleteHypothesis(
  hypothesisRepository,
  logger
)

const hypothesisStatusSyncService = buildSyncHypothesisStatus(
  hypothesisRepository,
  experimentRepository,
  metricRepository,
  measurementRepository,
  logger
)

const getHypothesisMetric = buildGetHypothesisMetric(
  metricRepository,
  logger
)

const upsertMetric = buildUpsertMetric(
  metricRepository,
  hypothesisStatusSyncService,
  logger
)

const deleteMetric = buildDeleteMetric(
  metricRepository,
  hypothesisStatusSyncService,
  logger
)

const getHypothesisExperiment = buildGetHypothesisExperiment(
  experimentRepository,
  logger
)

const upsertExperiment = buildUpsertExperiment(
  experimentRepository,
  hypothesisStatusSyncService,
  logger
)

const deleteExperiment = buildDeleteExperiment(
  experimentRepository,
  hypothesisStatusSyncService,
  logger
)

const getHypothesisMeasurement = buildGetHypothesisMeasurement(
  measurementRepository,
  logger
)

const upsertMeasurement = buildUpsertMeasurement(
  measurementRepository,
  hypothesisStatusSyncService,
  logger
)

const deleteMeasurement = buildDeleteMeasurement(
  measurementRepository,
  hypothesisStatusSyncService,
  logger
)

export {
  subscriptionService,
  createIdea,
  getIdeas,
  deleteIdea,
  getIdeaVersionCanvas,
  replaceIdeaVersionCanvas,
  createHypothesis,
  getIdeaVersionHypotheses,
  getHypothesis,
  updateHypothesis,
  deleteHypothesis,
  getHypothesisMetric,
  upsertMetric,
  deleteMetric,
  getHypothesisExperiment,
  upsertExperiment,
  deleteExperiment,
  getHypothesisMeasurement,
  upsertMeasurement,
  deleteMeasurement
}
